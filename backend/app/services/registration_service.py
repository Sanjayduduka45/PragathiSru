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
        # Fetch registrations from Supabase
        regs = await db.fetch_supabase("registrations", "select=*,team_members(*),projects(*)")
        if regs is None:
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

        if reg_id and len(reg_id) == 36 and "-" in reg_id:
            target_uuid = reg_id
        else:
            all_regs = await RegistrationService.get_registrations()
            for r in all_regs:
                if r.registration_id == reg_id or r.id == reg_id:
                    target_uuid = r.id
                    break

        if target_uuid is None:
            print(f"[RegistrationService] Record not found for reg_id={reg_id}")
            return False

        print(f"[RegistrationService] Target UUID resolved: {target_uuid}")

        # Delete dependent child rows explicitly to guarantee clean deletion
        await db.delete_supabase("team_members", "registration_id", target_uuid)
        await db.delete_supabase("projects", "registration_id", target_uuid)
        await db.delete_supabase("payments", "registration_id", target_uuid)

        # Delete parent registration
        success = await db.delete_supabase("registrations", "id", target_uuid)
        print(f"[RegistrationService] DB delete result: {success}")

        if not success:
            return False

        # Real verification - query DB directly to confirm 0 rows remain
        raw_check = await db.fetch_supabase("registrations", f"id=eq.{target_uuid}")
        if raw_check and len(raw_check) > 0:
            print(f"[RegistrationService] Post-delete verification failed: record {target_uuid} still exists.")
            return False

        print(f"[RegistrationService] Verification succeeded: record {target_uuid} deleted.")
        return True

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
