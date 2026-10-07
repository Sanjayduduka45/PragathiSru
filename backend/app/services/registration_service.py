from fastapi import HTTPException, UploadFile
import io
import time
import re
import zipfile
from typing import List, Optional, Dict, Any
from app.config import settings
from app.database import db
from app.schemas.registration import (
    RegistrationItem,
    RegistrationUpdate,
    RegistrationStats,
    TeamMember,
    ProjectInfo,
    InstitutionInfo,
    PaymentInfo
)
from app.services.domain_service import domain_service
from app.services.faq_service import faq_service

class RegistrationService:
    @staticmethod
    async def get_registrations() -> List[RegistrationItem]:
        # Fetch registrations from Supabase with relational join including institutions, team_members, projects, payments
        regs = await db.fetch_supabase("registrations", "select=*,institutions(*),team_members(*),projects(*),payments(*)&order=created_at.desc")
        # Fallback to simple select=* if relational join query returned empty/None
        if not regs:
            print("[RegistrationService] Relational query returned empty/None. Falling back to select=*")
            regs = await db.fetch_supabase("registrations", "select=*&order=created_at.desc")
        if not regs:
            regs = []

        result: List[RegistrationItem] = []
        for r in regs:
            # Resolve institution relation
            raw_inst = r.get("institutions")
            inst_obj: Optional[InstitutionInfo] = None
            inst_name: Optional[str] = None
            inst_type: Optional[str] = None

            if isinstance(raw_inst, list) and len(raw_inst) > 0:
                first_inst = raw_inst[0]
                if isinstance(first_inst, dict):
                    try:
                        inst_obj = InstitutionInfo(**first_inst)
                        inst_name = first_inst.get("name")
                        inst_type = first_inst.get("institution_type")
                    except Exception as e:
                        print(f"[RegistrationService] Institution parse error: {e}")
            elif isinstance(raw_inst, dict):
                try:
                    inst_obj = InstitutionInfo(**raw_inst)
                    inst_name = raw_inst.get("name")
                    inst_type = raw_inst.get("institution_type")
                except Exception as e:
                    print(f"[RegistrationService] Institution parse error: {e}")

            # Fallback only if relation was not present
            if not inst_name:
                inst_name = r.get("institution_name") or r.get("institution")
            if not inst_type:
                inst_type = r.get("institution_type")

            if inst_name and not inst_obj:
                inst_obj = InstitutionInfo(
                    id=r.get("institution_id"),
                    name=inst_name,
                    institution_type=inst_type
                )

            tm_list: List[TeamMember] = []
            raw_members = r.get("team_members")
            if isinstance(raw_members, list):
                for m in raw_members:
                    if isinstance(m, dict):
                        try:
                            tm_list.append(TeamMember(**m))
                        except Exception as e:
                            print(f"[RegistrationService] Skipping invalid team_member dict: {e}")
            elif isinstance(raw_members, dict):
                try:
                    tm_list.append(TeamMember(**raw_members))
                except Exception as e:
                    print(f"[RegistrationService] Skipping invalid team_member dict: {e}")

            # If team_members is empty, auto-create leader entry if leader_name is present
            if not tm_list and r.get("leader_name"):
                tm_list.append(TeamMember(
                    id=f"leader-{r.get('id')}",
                    name=r.get("leader_name", ""),
                    email=r.get("leader_email", ""),
                    mobile=r.get("leader_mobile"),
                    is_team_leader=True
                ))

            proj_list: List[ProjectInfo] = []
            raw_projects = r.get("projects")
            if isinstance(raw_projects, list):
                for p in raw_projects:
                    if isinstance(p, dict):
                        try:
                            proj_list.append(ProjectInfo(**p))
                        except Exception as e:
                            print(f"[RegistrationService] Skipping invalid project dict: {e}")
            elif isinstance(raw_projects, dict):
                try:
                    proj_list.append(ProjectInfo(**raw_projects))
                except Exception as e:
                    print(f"[RegistrationService] Skipping invalid project dict: {e}")
            
            pay_list: List[PaymentInfo] = []
            raw_payments = r.get("payments")
            proof_path: Optional[str] = r.get("payment_proof_path") or r.get("payment_reference")
            if isinstance(raw_payments, list):
                for pm in raw_payments:
                    if isinstance(pm, dict):
                        try:
                            pay_info = PaymentInfo(**pm)
                            pay_list.append(pay_info)
                            if not proof_path and pm.get("payment_proof_path"):
                                proof_path = pm.get("payment_proof_path")
                        except Exception as e:
                            print(f"[RegistrationService] Skipping invalid payment dict: {e}")
            elif isinstance(raw_payments, dict):
                try:
                    pay_info = PaymentInfo(**raw_payments)
                    pay_list.append(pay_info)
                    if not proof_path and raw_payments.get("payment_proof_path"):
                        proof_path = raw_payments.get("payment_proof_path")
                except Exception as e:
                    print(f"[RegistrationService] Skipping invalid payment dict: {e}")

            item = RegistrationItem(
                id=r.get("id"),
                registration_id=r.get("registration_id", f"PRAGATHI26-{str(r.get('id', ''))[:6]}"),
                team_name=r.get("team_name", "Untitled Team"),
                participant_type=r.get("participant_type", "external_student"),
                team_size=r.get("team_size", 1),
                institution_id=r.get("institution_id"),
                institution_name=inst_name,
                institution_type=inst_type,
                institutions=inst_obj,
                leader_name=r.get("leader_name", ""),
                leader_email=r.get("leader_email", ""),
                leader_mobile=r.get("leader_mobile"),
                registration_status=r.get("registration_status", "submitted"),
                payment_status=r.get("payment_status", "not_required"),
                payment_amount=r.get("payment_amount", 0),
                payment_reference=r.get("payment_reference"),
                payment_proof_path=proof_path,
                team_members=tm_list,
                projects=proj_list,
                payments=pay_list,
                created_at=r.get("created_at")
            )
            result.append(item)
        return result

    @staticmethod
    async def get_registration(registration_id: str) -> Optional[RegistrationItem]:
        all_regs = await RegistrationService.get_registrations()
        for r in all_regs:
            if str(r.id) == str(registration_id) or str(r.registration_id) == str(registration_id):
                return r
        return None

    @staticmethod
    async def update_registration(reg_id: str, data: RegistrationUpdate) -> Optional[RegistrationItem]:
        clean_id = reg_id.strip()
        target_uuid = clean_id

        # Resolve UUID if human-readable registration_id is provided
        if len(clean_id) != 36 or "-" not in clean_id:
            check_rows = await db.fetch_supabase("registrations", f"registration_id=eq.{clean_id}&select=id")
            if check_rows and len(check_rows) > 0:
                target_uuid = check_rows[0].get("id")

        payload: Dict[str, Any] = {}
        if data.team_name is not None: payload["team_name"] = data.team_name
        if data.participant_type is not None: payload["participant_type"] = data.participant_type
        if data.leader_name is not None: payload["leader_name"] = data.leader_name
        if data.leader_email is not None: payload["leader_email"] = data.leader_email
        if data.leader_mobile is not None: payload["leader_mobile"] = data.leader_mobile
        if data.registration_status is not None: payload["registration_status"] = data.registration_status
        if data.payment_status is not None: payload["payment_status"] = data.payment_status
        if data.payment_amount is not None: payload["payment_amount"] = data.payment_amount
        if data.payment_reference is not None: payload["payment_reference"] = data.payment_reference

        if payload:
            success = await db.update_supabase("registrations", "id", target_uuid, payload)
            if not success:
                print(f"[RegistrationService] Update failed on Supabase for id='{target_uuid}'")
                # Also check local fallback
                local_data = db.load_local()
                if "registrations" in local_data:
                    for r in local_data["registrations"]:
                        if r.get("id") == target_uuid or r.get("registration_id") == clean_id:
                            r.update(payload)
                            db.save_local(local_data)
                            break

        return await RegistrationService.get_registration(target_uuid)

    @staticmethod
    async def delete_registration(reg_id: str) -> bool:
        print(f"[RegistrationService] DELETE request received for reg_id={reg_id}")
        target_uuid = None
        reg_code = None

        if not reg_id or not reg_id.strip():
            print(f"[RegistrationService] Empty reg_id provided.")
            return False

        clean_id = reg_id.strip()

        # CASE 1: reg_id is a 36-character UUID
        if len(clean_id) == 36 and "-" in clean_id:
            check_rows = await db.fetch_supabase("registrations", f"id=eq.{clean_id}&select=id,registration_id")
            if check_rows and len(check_rows) > 0:
                target_uuid = check_rows[0].get("id")
                reg_code = check_rows[0].get("registration_id")

        # CASE 2: reg_id is human-readable (e.g. PRAGATHI26-XXXXXX) or non-standard identifier
        if target_uuid is None:
            by_reg_code = await db.fetch_supabase("registrations", f"registration_id=eq.{clean_id}&select=id,registration_id")
            if by_reg_code and len(by_reg_code) > 0:
                target_uuid = by_reg_code[0].get("id")
                reg_code = by_reg_code[0].get("registration_id")
            else:
                by_id_col = await db.fetch_supabase("registrations", f"id=eq.{clean_id}&select=id,registration_id")
                if by_id_col and len(by_id_col) > 0:
                    target_uuid = by_id_col[0].get("id")
                    reg_code = by_id_col[0].get("registration_id")

        if target_uuid is None:
            print(f"[RegistrationService] Record not found in Supabase for reg_id='{clean_id}'")
            raise HTTPException(
                status_code=404,
                detail=f"Registration '{clean_id}' was not found in database."
            )

        print(f"[RegistrationService] Successfully resolved '{clean_id}' -> target_uuid='{target_uuid}'")

        # Delete parent registration row using target_uuid (PostgreSQL CASCADE deletes dependent rows)
        success = await db.delete_supabase("registrations", "id", target_uuid)
        print(f"[RegistrationService] DB delete execution result for '{target_uuid}': {success}")

        # Also remove from local_store fallback if present
        local_data = db.load_local()
        if "registrations" in local_data:
            orig_len = len(local_data["registrations"])
            local_data["registrations"] = [
                r for r in local_data["registrations"]
                if r.get("id") != target_uuid and r.get("registration_id") != clean_id
            ]
            if len(local_data["registrations"]) < orig_len:
                db.save_local(local_data)
                print(f"[RegistrationService] Removed '{target_uuid}' from local data store fallback.")
                success = True

        return success

    @staticmethod
    async def get_email_logs(reg_id: str) -> List[Dict[str, Any]]:
        # Resolve target UUID / registration_code
        clean_id = reg_id.strip()
        target_uuid = clean_id
        
        # Check if reg_id is registration_code or UUID
        rows = await db.fetch_supabase(
            "registration_email_logs",
            f"or=(registration_id.eq.{clean_id},registration_code.eq.{clean_id})&order=created_at.desc"
        )
        if not rows:
            rows = await db.fetch_supabase(
                "registration_email_logs",
                f"registration_code=eq.{clean_id}&order=created_at.desc"
            )
        return rows or []

    @staticmethod
    async def resend_confirmation_email(reg_id: str, member_id: Optional[str] = None) -> Dict[str, Any]:
        # Verify registration exists
        reg = await RegistrationService.get_registration(reg_id)
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found")

        # Invoke Supabase Edge Function: send-registration-confirmation
        function_url = f"{db.settings.supabase_url if hasattr(db, 'settings') else 'https://ajoixggemnuokpcwomnn.supabase.co'}/functions/v1/send-registration-confirmation"
        from app.config import settings
        function_url = f"{settings.supabase_url}/functions/v1/send-registration-confirmation"
        
        headers = {
            "Content-Type": "application/json",
            "apikey": settings.supabase_key,
            "Authorization": f"Bearer {settings.supabase_key}"
        }
        
        payload = {
            "registrationId": reg.registration_id,
            "forceResend": True
        }
        if member_id:
            payload["memberId"] = member_id

        import httpx
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(function_url, headers=headers, json=payload)
                data = res.json()
                if res.status_code in (200, 201) and data.get("success"):
                    return {
                        "success": True,
                        "message": f"Confirmation email process triggered for {reg.registration_id}",
                        "results": data.get("results")
                    }
                else:
                    return {
                        "success": False,
                        "message": data.get("error", f"Edge Function returned HTTP {res.status_code}"),
                        "results": data.get("results")
                    }
        except Exception as e:
            print(f"[RegistrationService] Error calling send-registration-confirmation function: {e}")
            return {
                "success": False,
                "message": f"Failed to contact email service: {str(e)}"
            }

    @staticmethod
    async def get_stats() -> RegistrationStats:
        regs = await RegistrationService.get_registrations()
        total = len(regs)
        free = sum(1 for r in regs if r.payment_status == "not_required")
        paid = sum(1 for r in regs if r.payment_status == "paid")
        pending = sum(1 for r in regs if r.payment_status == "pending")

        domains = await domain_service.get_domains()
        active_domains = sum(1 for d in domains if d.active)

        faqs = await faq_service.get_faqs()
        active_faqs = sum(1 for f in faqs if f.active)

        return RegistrationStats(
            total=total,
            free=free,
            paid=paid,
            pending=pending,
            domains_count=active_domains,
            faqs_count=active_faqs
        )

    @staticmethod
    def _is_valid_uuid(val: str) -> bool:
        try:
            import uuid
            uuid.UUID(str(val))
            return True
        except Exception:
            return False

    @staticmethod
    async def upload_payment_proof(
        registration_id: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        transaction_id: Optional[str] = None
    ) -> Dict[str, Any]:
        ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]
        MAX_SIZE = 5 * 1024 * 1024

        if not file_bytes or len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if len(file_bytes) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit of 5MB.")

        clean_ct = content_type.lower().split(";")[0].strip()
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if clean_ct not in ALLOWED_TYPES and ext not in ["png", "jpg", "jpeg", "webp", "pdf"]:
            raise HTTPException(status_code=400, detail="Invalid file type. Allowed formats: PNG, JPG, JPEG, WEBP, PDF.")

        clean_reg_id = registration_id.strip()
        is_uuid = RegistrationService._is_valid_uuid(clean_reg_id)

        target_uuid = None
        public_reg_code = clean_reg_id

        # Query database safely without passing non-UUID strings to UUID columns
        check_rows = None
        if is_uuid:
            check_rows = await db.fetch_supabase("registrations", f"id=eq.{clean_reg_id}&select=id,registration_id")
        if not check_rows:
            check_rows = await db.fetch_supabase("registrations", f"registration_id=eq.{clean_reg_id}&select=id,registration_id")

        if check_rows and len(check_rows) > 0:
            target_uuid = check_rows[0].get("id")
            public_reg_code = check_rows[0].get("registration_id") or clean_reg_id
        else:
            settings = await settings_service.get_settings()
            if not settings.event.external_registration_open:
                raise HTTPException(
                    status_code=403,
                    detail="Registration for external participants is currently closed. No new payment verification process can be initiated."
                )
            if not clean_reg_id.startswith("REG-") and not clean_reg_id.startswith("TEMP-") and not clean_reg_id.startswith("PRAGATHI"):
                raise HTTPException(status_code=404, detail=f"Registration record '{clean_reg_id}' not found in database.")

        sanitized_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
        storage_path = f"{public_reg_code}/{int(time.time())}_{sanitized_filename}"

        proof_path = await db.upload_private_supabase_storage("payment-proofs", storage_path, file_bytes, clean_ct)
        if not proof_path:
            raise HTTPException(status_code=500, detail="Failed to store payment proof image in private storage.")

        # If registration record exists in DB, update payments and registrations tables
        if target_uuid:
            payment_payload: Dict[str, Any] = {
                "registration_id": target_uuid,  # Guaranteed UUID foreign key
                "amount": 1000,
                "currency": "INR",
                "status": "pending",
                "gateway_reference": proof_path,
                "transaction_id": transaction_id or None,
                "payment_proof_path": proof_path,
                "updated_at": "now()"
            }

            existing_pay = await db.fetch_supabase("payments", f"registration_id=eq.{target_uuid}&select=id")
            pay_success = False

            if existing_pay and len(existing_pay) > 0:
                pay_id = existing_pay[0].get("id")
                updated_res = await db.update_supabase("payments", "id", pay_id, payment_payload)
                if not updated_res:
                    # Fallback without payment_proof_path if column is missing in DB schema cache
                    fallback_payload = {k: v for k, v in payment_payload.items() if k != "payment_proof_path"}
                    updated_res = await db.update_supabase("payments", "id", pay_id, fallback_payload)
                pay_success = bool(updated_res)
            else:
                inserted_res = await db.insert_supabase("payments", payment_payload)
                if not inserted_res:
                    # Fallback without payment_proof_path if column is missing in DB schema cache
                    fallback_payload = {k: v for k, v in payment_payload.items() if k != "payment_proof_path"}
                    inserted_res = await db.insert_supabase("payments", fallback_payload)
                pay_success = bool(inserted_res)

            if not pay_success:
                raise HTTPException(status_code=500, detail="Failed to create or update payment record in database.")

            reg_update_success = await db.update_supabase("registrations", "id", target_uuid, {
                "payment_status": "pending",
                "payment_amount": 1000,
                "payment_reference": transaction_id or proof_path,
                "registration_status": "submitted"
            })
            if not reg_update_success:
                raise HTTPException(status_code=500, detail="Failed to update registration payment status in database.")

        return {
            "success": True,
            "payment_proof_path": proof_path,
            "registration_id": public_reg_code,
            "message": "Payment proof uploaded successfully."
        }

    @staticmethod
    async def approve_payment(reg_id_or_pay_id: str, notes: Optional[str] = None) -> Optional[RegistrationItem]:
        clean_id = reg_id_or_pay_id.strip()
        is_uuid = RegistrationService._is_valid_uuid(clean_id)
        target_uuid = None
        reg_code = None

        reg_row = None
        if is_uuid:
            by_id = await db.fetch_supabase("registrations", f"id=eq.{clean_id}&select=*")
            if by_id and len(by_id) > 0:
                reg_row = by_id[0]

        if not reg_row:
            by_code = await db.fetch_supabase("registrations", f"registration_id=eq.{clean_id}&select=*")
            if by_code and len(by_code) > 0:
                reg_row = by_code[0]

        if not reg_row and is_uuid:
            by_pay = await db.fetch_supabase("payments", f"id=eq.{clean_id}&select=*")
            if by_pay and len(by_pay) > 0:
                reg_id_foreign = by_pay[0].get("registration_id")
                if reg_id_foreign:
                    by_foreign = await db.fetch_supabase("registrations", f"id=eq.{reg_id_foreign}&select=*")
                    if by_foreign and len(by_foreign) > 0:
                        reg_row = by_foreign[0]

        if not reg_row:
            raise HTTPException(status_code=404, detail=f"Registration or payment record '{clean_id}' not found.")

        target_uuid = reg_row.get("id")
        reg_code = reg_row.get("registration_id")
        current_pay_status = str(reg_row.get("payment_status") or "").strip().lower()
        participant_type = str(reg_row.get("participant_type") or "").strip().lower()
        is_sru = (current_pay_status == "not_required") or (participant_type != "external_student")

        if is_sru and reg_row.get("registration_status") == "approved":
            print(f"[RegistrationService] Approval skipped for SRU '{reg_code}' — already approved.")
            return await RegistrationService.get_registration(target_uuid)
        elif not is_sru and reg_row.get("payment_status") == "paid" and reg_row.get("registration_status") == "approved":
            print(f"[RegistrationService] Approval skipped for '{reg_code}' — already paid/approved.")
            return await RegistrationService.get_registration(target_uuid)

        if is_sru:
            await db.update_supabase("registrations", "id", target_uuid, {
                "registration_status": "approved"
            })
        else:
            await db.update_supabase("payments", "registration_id", target_uuid, {
                "status": "paid"
            })
            await db.update_supabase("registrations", "id", target_uuid, {
                "payment_status": "paid",
                "registration_status": "approved"
            })

        if reg_code:
            try:
                print(f"[RegistrationService] Registration approved for '{reg_code}' — triggering confirmation email.")
                await RegistrationService.resend_confirmation_email(reg_code)
            except Exception as e:
                print(f"[RegistrationService] Email trigger error during approval: {e}")

        return await RegistrationService.get_registration(target_uuid)

    @staticmethod
    async def reject_payment(reg_id_or_pay_id: str, reason: Optional[str] = None) -> Optional[RegistrationItem]:
        clean_id = reg_id_or_pay_id.strip()
        is_uuid = RegistrationService._is_valid_uuid(clean_id)
        target_uuid = None
        reg_code = None

        reg_row = None
        if is_uuid:
            by_id = await db.fetch_supabase("registrations", f"id=eq.{clean_id}&select=*")
            if by_id and len(by_id) > 0:
                reg_row = by_id[0]

        if not reg_row:
            by_code = await db.fetch_supabase("registrations", f"registration_id=eq.{clean_id}&select=*")
            if by_code and len(by_code) > 0:
                reg_row = by_code[0]

        if not reg_row and is_uuid:
            by_pay = await db.fetch_supabase("payments", f"id=eq.{clean_id}&select=*")
            if by_pay and len(by_pay) > 0:
                reg_id_foreign = by_pay[0].get("registration_id")
                if reg_id_foreign:
                    by_foreign = await db.fetch_supabase("registrations", f"id=eq.{reg_id_foreign}&select=*")
                    if by_foreign and len(by_foreign) > 0:
                        reg_row = by_foreign[0]

        if not reg_row:
            raise HTTPException(status_code=404, detail=f"Registration or payment record '{clean_id}' not found.")

        target_uuid = reg_row.get("id")
        reg_code = reg_row.get("registration_id")
        current_pay_status = str(reg_row.get("payment_status") or "").strip().lower()
        participant_type = str(reg_row.get("participant_type") or "").strip().lower()
        is_sru = (current_pay_status == "not_required") or (participant_type != "external_student")

        if is_sru:
            await db.update_supabase("registrations", "id", target_uuid, {
                "registration_status": "rejected"
            })
        else:
            await db.update_supabase("payments", "registration_id", target_uuid, {
                "status": "failed"
            })
            await db.update_supabase("registrations", "id", target_uuid, {
                "payment_status": "failed",
                "registration_status": "rejected"
            })

        return await RegistrationService.get_registration(target_uuid)

    @staticmethod
    async def get_payment_proof_signed_url(reg_id_or_pay_id: str) -> Dict[str, Any]:
        clean_id = reg_id_or_pay_id.strip()
        is_uuid = RegistrationService._is_valid_uuid(clean_id)
        proof_path = None

        if is_uuid:
            by_pay = await db.fetch_supabase("payments", f"id=eq.{clean_id}&select=payment_proof_path,gateway_reference")
            if by_pay and len(by_pay) > 0:
                proof_path = by_pay[0].get("payment_proof_path") or by_pay[0].get("gateway_reference")

        if not proof_path and is_uuid:
            by_pay_reg = await db.fetch_supabase("payments", f"registration_id=eq.{clean_id}&select=payment_proof_path,gateway_reference")
            if by_pay_reg and len(by_pay_reg) > 0:
                proof_path = by_pay_reg[0].get("payment_proof_path") or by_pay_reg[0].get("gateway_reference")

        if not proof_path:
            query = f"id=eq.{clean_id}&select=payment_reference,payment_proof_path" if is_uuid else f"registration_id=eq.{clean_id}&select=payment_reference,payment_proof_path"
            by_reg = await db.fetch_supabase("registrations", query)
            if by_reg and len(by_reg) > 0:
                proof_path = by_reg[0].get("payment_proof_path") or by_reg[0].get("payment_reference")

        if not proof_path:
            raise HTTPException(status_code=404, detail="Payment proof file not found for this registration.")

        clean_path = proof_path.replace("payment-proofs/", "")

        signed_url = await db.create_signed_url("payment-proofs", clean_path, expires_in=600)
        if not signed_url:
            raise HTTPException(status_code=500, detail="Failed to generate secure signed URL for payment proof.")

        return {
            "success": True,
            "signed_url": signed_url,
            "payment_proof_path": proof_path,
            "expires_in": 600
        }

    @staticmethod
    def _build_manifest_xlsx(headers: List[str], rows: List[List[Any]]) -> bytes:
        out = io.BytesIO()
        with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
            z.writestr('[Content_Types].xml', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>''')
            z.writestr('_rels/.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>''')
            z.writestr('xl/_rels/workbook.xml.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>''')
            z.writestr('xl/workbook.xml', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Payment Proofs Manifest" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>''')
            sheet_rows = []
            h_cells = []
            for c_idx, h in enumerate(headers):
                col_letter = chr(65 + c_idx) if c_idx < 26 else f'A{chr(65 + c_idx - 26)}'
                h_cells.append(f'<c r="{col_letter}1" t="inlineStr"><is><t>{h}</t></is></c>')
            sheet_rows.append('<row r="1">' + ''.join(h_cells) + '</row>')

            for r_idx, row in enumerate(rows, start=2):
                r_cells = []
                for c_idx, val in enumerate(row):
                    col_letter = chr(65 + c_idx) if c_idx < 26 else f'A{chr(65 + c_idx - 26)}'
                    clean_val = str(val if val is not None else '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    r_cells.append(f'<c r="{col_letter}{r_idx}" t="inlineStr"><is><t>{clean_val}</t></is></c>')
                sheet_rows.append(f'<row r="{r_idx}">' + ''.join(r_cells) + '</row>')

            sheet_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>{''.join(sheet_rows)}</sheetData>
</worksheet>'''
            z.writestr('xl/worksheets/sheet1.xml', sheet_xml)

        return out.getvalue()

    @staticmethod
    async def export_payment_proofs_zip(registration_ids: Optional[List[str]] = None) -> bytes:
        all_regs = await RegistrationService.get_registrations()
        target_ids = set(registration_ids) if registration_ids else None

        filtered = []
        for r in all_regs:
            p_type = (r.participant_type or "").strip().lower()
            if p_type != "external_student":
                continue
            if target_ids is not None:
                if r.id not in target_ids and r.registration_id not in target_ids:
                    continue
            filtered.append(r)

        if not filtered:
            raise HTTPException(
                status_code=404,
                detail="No external registrations match the current filter selection."
            )

        client = db.get_client()
        key = settings.get_effective_key()
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
        }

        zip_buf = io.BytesIO()
        total_proof_files = 0
        manifest_rows = []

        domains_map = {}
        try:
            doms = await domain_service.get_all_domains()
            for d in doms:
                domains_map[d.id] = d.title
        except Exception:
            pass

        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as z:
            for reg in filtered:
                reg_id = reg.registration_id or reg.id
                team_name = reg.team_name or "Team"
                safe_team = re.sub(r"[^a-zA-Z0-9_-]", "_", team_name)

                theme_title = "N/A"
                if reg.projects and len(reg.projects) > 0:
                    cat = reg.projects[0].category or ""
                    theme_title = domains_map.get(cat, cat.replace("-", " ").title())

                s_stat = (reg.registration_status or "submitted").strip().lower()
                if s_stat in ("approved", "confirmed", "verified"):
                    appr_label = "Approved"
                elif s_stat in ("rejected", "failed"):
                    appr_label = "Rejected"
                else:
                    appr_label = "Approval Pending"

                pay_stat = (reg.payment_status or "pending").upper()
                amt_str = f"₹{reg.payment_amount}" if reg.payment_amount else "₹0"
                txn_ref = reg.payment_reference or "N/A"
                if reg.payments and len(reg.payments) > 0:
                    txn_ref = reg.payments[0].transaction_id or reg.payments[0].gateway_reference or txn_ref

                list_url = f"{settings.supabase_url}/storage/v1/object/list/payment-proofs"
                reg_files = []
                try:
                    list_res = await client.post(
                        list_url,
                        headers={**headers, "Content-Type": "application/json"},
                        json={"prefix": reg_id}
                    )
                    if list_res.status_code == 200:
                        raw_items = list_res.json()
                        if isinstance(raw_items, list):
                            reg_files = [f["name"] for f in raw_items if f.get("name") and not f["name"].startswith(".")]
                except Exception as e:
                    print(f"[Export Proofs] Error listing files for {reg_id}: {e}")

                added_filenames = []
                for idx, fname in enumerate(reg_files):
                    ext = fname.split(".")[-1] if "." in fname else "jpeg"
                    out_filename = f"{reg_id}_{safe_team}.{ext}" if idx == 0 else f"{reg_id}_{safe_team}_{idx + 1}.{ext}"
                    dl_url = f"{settings.supabase_url}/storage/v1/object/payment-proofs/{reg_id}/{fname}"
                    try:
                        dl_res = await client.get(dl_url, headers=headers)
                        if dl_res.status_code == 200 and len(dl_res.content) > 0:
                            z.writestr(f"Payment_Proofs/{out_filename}", dl_res.content)
                            added_filenames.append(out_filename)
                            total_proof_files += 1
                    except Exception as e:
                        print(f"[Export Proofs] Error downloading {fname}: {e}")

                has_proof = "Yes" if len(added_filenames) > 0 else "No"
                inst_name = reg.institution_name or (reg.institutions.name if reg.institutions else "N/A")
                manifest_rows.append([
                    reg_id,
                    team_name,
                    theme_title,
                    "External Participants",
                    inst_name,
                    appr_label,
                    pay_stat,
                    amt_str,
                    txn_ref,
                    has_proof,
                    len(added_filenames),
                    ", ".join(added_filenames) if added_filenames else "N/A"
                ])

            if total_proof_files == 0:
                raise HTTPException(
                    status_code=404,
                    detail="No payment proofs found for the current filters."
                )

            headers_list = [
                "Registration ID",
                "Team Name",
                "Theme",
                "Participant Type",
                "Institution",
                "Registration Approval Status",
                "Payment Status",
                "Amount",
                "Transaction ID",
                "Payment Proof Available",
                "Number of Payment Proof Files",
                "Payment Proof Filename(s)"
            ]
            manifest_bytes = RegistrationService._build_manifest_xlsx(headers_list, manifest_rows)
            z.writestr("Payment_Proofs_Manifest.xlsx", manifest_bytes)

        return zip_buf.getvalue()

registration_service = RegistrationService()

