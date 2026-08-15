from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.schemas.registration import (
    RegistrationListResponse,
    RegistrationResponse,
    RegistrationUpdate,
    RegistrationStatsResponse,
    EmailLogListResponse,
    EmailLogItem,
    ResendEmailResponse
)
from app.services.registration_service import registration_service

router = APIRouter()

@router.get("/api/admin/registrations", response_model=RegistrationListResponse)
async def list_registrations():
    regs = await registration_service.get_registrations()
    return RegistrationListResponse(data=regs)

@router.get("/api/admin/registrations/{reg_id}", response_model=RegistrationResponse)
async def get_registration(reg_id: str):
    reg = await registration_service.get_registration(reg_id)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    return RegistrationResponse(data=reg)

@router.get("/api/admin/registrations/{reg_id}/emails", response_model=EmailLogListResponse)
async def get_registration_email_logs(reg_id: str):
    logs = await registration_service.get_email_logs(reg_id)
    typed_logs = []
    for l in logs:
        typed_logs.append(EmailLogItem(
            id=l.get("id"),
            registration_id=l.get("registration_id"),
            registration_code=l.get("registration_code", reg_id),
            member_id=l.get("member_id"),
            recipient_name=l.get("recipient_name", ""),
            recipient_email=l.get("recipient_email", ""),
            recipient_role=l.get("recipient_role", "Member"),
            email_type=l.get("email_type", "registration_confirmation"),
            subject=l.get("subject", ""),
            status=l.get("status", "pending"),
            provider=l.get("provider", "resend"),
            provider_message_id=l.get("provider_message_id"),
            error_message=l.get("error_message"),
            sent_at=l.get("sent_at"),
            created_at=l.get("created_at")
        ))
    return EmailLogListResponse(data=typed_logs)

@router.post("/api/admin/registrations/{reg_id}/resend-email", response_model=ResendEmailResponse)
async def resend_confirmation_email(reg_id: str, member_id: Optional[str] = Query(None)):
    res = await registration_service.resend_confirmation_email(reg_id, member_id)
    return ResendEmailResponse(
        success=res.get("success", False),
        message=res.get("message", ""),
        results=res.get("results")
    )

@router.put("/api/admin/registrations/{reg_id}", response_model=RegistrationResponse)
async def update_registration(reg_id: str, data: RegistrationUpdate):
    updated = await registration_service.update_registration(reg_id, data)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update registration")
    return RegistrationResponse(data=updated)

@router.delete("/api/admin/registrations/{reg_id}")
async def delete_registration(reg_id: str):
    try:
        success = await registration_service.delete_registration(reg_id)
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Registration was not found or was not deleted."
            )
        return {"success": True, "message": f"Registration {reg_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API Error] Exception during delete_registration({reg_id}): {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete registration: {str(e)}"
        )

@router.get("/api/admin/stats", response_model=RegistrationStatsResponse)
async def get_dashboard_stats():
    stats = await registration_service.get_stats()
    return RegistrationStatsResponse(data=stats)

