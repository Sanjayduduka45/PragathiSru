from fastapi import HTTPException
from typing import List, Optional, Dict, Any
from app.database import db
from app.schemas.registration import (
    RegistrationItem,
    RegistrationUpdate,
    RegistrationStats,
    TeamMember,
    ProjectInfo
)
from app.services.domain_service import domain_service
from app.services.faq_service import faq_service

class RegistrationService:
    @staticmethod
    async def get_registrations() -> List[RegistrationItem]:
        # Fetch registrations from Supabase with relational join
        regs = await db.fetch_supabase("registrations", "select=*,team_members(*),projects(*)&order=created_at.desc")
        # Fallback to simple select=* if relational join query returned empty/None
        if not regs:
            print("[RegistrationService] Relational query returned empty/None. Falling back to select=*")
            regs = await db.fetch_supabase("registrations", "select=*&order=created_at.desc")
        if not regs:
            regs = []

        result: List[RegistrationItem] = []
        for r in regs:
            tm_list = []
            if r.get("team_members"):
                for m in r.get("team_members", []):
                    if isinstance(m, dict):
                        try:
                            tm_list.append(TeamMember(**m))
                        except Exception as e:
                            print(f"[RegistrationService] Skipping invalid team_member dict: {e}")
                    elif isinstance(m, str):
                        tm_list.append(TeamMember(id=m, name=m, email=""))

            # If team_members is empty, auto-create leader entry if leader_name is present
            if not tm_list and r.get("leader_name"):
                tm_list.append(TeamMember(
                    id=f"leader-{r.get('id')}",
                    name=r.get("leader_name", ""),
                    email=r.get("leader_email", ""),
                    mobile=r.get("leader_mobile"),
                    is_team_leader=True
                ))

            proj_list = []
            if r.get("projects"):
                for p in r.get("projects", []):
                    if isinstance(p, dict):
                        try:
                            proj_list.append(ProjectInfo(**p))
                        except Exception as e:
                            print(f"[RegistrationService] Skipping invalid project dict: {e}")
                    elif isinstance(p, str):
                        proj_list.append(ProjectInfo(id=p, title=p, category="General"))
            
            item = RegistrationItem(
                id=r.get("id"),
                registration_id=r.get("registration_id", f"PRAGATHI26-{str(r.get('id', ''))[:6]}"),
                team_name=r.get("team_name", "Untitled Team"),
                participant_type=r.get("participant_type", "external_student"),
                team_size=r.get("team_size", 1),
                leader_name=r.get("leader_name", ""),
                leader_email=r.get("leader_email", ""),
                leader_mobile=r.get("leader_mobile"),
                registration_status=r.get("registration_status", "submitted"),
                payment_status=r.get("payment_status", "not_required"),
                payment_amount=r.get("payment_amount", 0),
                payment_reference=r.get("payment_reference"),
                team_members=tm_list,
                projects=proj_list,
                created_at=r.get("created_at")
            )
            result.append(item)
        return result

    @staticmethod
    async def get_registration(registration_id: str) -> Optional[RegistrationItem]:
        all_regs = await RegistrationService.get_registrations()
        for r in all_regs:
            if r.id == registration_id or r.registration_id == registration_id:
                return r
        return None

    @staticmethod
    async def update_registration(reg_id: str, data: RegistrationUpdate) -> Optional[RegistrationItem]:
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
            await db.update_supabase("registrations", "id", reg_id, payload)

        return await RegistrationService.get_registration(reg_id)

    @staticmethod
    async def delete_registration(reg_id: str) -> bool:
        print(f"[RegistrationService] DELETE request received for reg_id={reg_id}")
        target_uuid = None

        if not reg_id or not reg_id.strip():
            print(f"[RegistrationService] Empty reg_id provided.")
            return False

        clean_id = reg_id.strip()

        # CASE 1: reg_id is a 36-character UUID
        if len(clean_id) == 36 and "-" in clean_id:
            check_rows = await db.fetch_supabase("registrations", f"id=eq.{clean_id}&select=id,registration_id")
            if check_rows and len(check_rows) > 0:
                target_uuid = check_rows[0].get("id")

        # CASE 2: reg_id is human-readable (e.g. PRAGATHI26-N7BD4T) or non-standard identifier
        if target_uuid is None:
            by_reg_code = await db.fetch_supabase("registrations", f"registration_id=eq.{clean_id}&select=id,registration_id")
            if by_reg_code and len(by_reg_code) > 0:
                target_uuid = by_reg_code[0].get("id")
            else:
                by_id_col = await db.fetch_supabase("registrations", f"id=eq.{clean_id}&select=id,registration_id")
                if by_id_col and len(by_id_col) > 0:
                    target_uuid = by_id_col[0].get("id")

        if target_uuid is None:
            print(f"[RegistrationService] Record not found in Supabase for reg_id='{clean_id}'")
            raise HTTPException(
                status_code=404,
                detail=f"Registration '{clean_id}' was not found in database."
            )

        print(f"[RegistrationService] Successfully resolved '{clean_id}' -> target_uuid='{target_uuid}'")

        # Delete dependent child rows explicitly to guarantee clean deletion
        await db.delete_supabase("team_members", "registration_id", target_uuid)
        await db.delete_supabase("projects", "registration_id", target_uuid)
        await db.delete_supabase("payments", "registration_id", target_uuid)

        # Delete parent registration row using target_uuid
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

        if not success:
            print(f"[RegistrationService] Deletion execution failed for target UUID '{target_uuid}'")
            raise HTTPException(
                status_code=500,
                detail=f"Database deletion query returned zero deleted rows for UUID '{target_uuid}'. Verify SUPABASE_SERVICE_ROLE_KEY environment variable."
            )

        # Real verification - query DB directly to confirm 0 rows remain
        raw_check = await db.fetch_supabase("registrations", f"id=eq.{target_uuid}&select=id")
        if raw_check and len(raw_check) > 0:
            print(f"[RegistrationService] Post-delete verification failed: record '{target_uuid}' still exists in PostgreSQL.")
            raise HTTPException(
                status_code=500,
                detail=f"Registration resolved to UUID '{target_uuid}', but post-delete verification failed (record still present in DB)."
            )

        print(f"[RegistrationService] Verification succeeded: record '{target_uuid}' completely deleted.")
        return True

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

registration_service = RegistrationService()

