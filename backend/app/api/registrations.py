from fastapi import APIRouter, HTTPException
from app.schemas.registration import (
    RegistrationListResponse,
    RegistrationResponse,
    RegistrationUpdate,
    RegistrationStatsResponse
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

@router.put("/api/admin/registrations/{reg_id}", response_model=RegistrationResponse)
async def update_registration(reg_id: str, data: RegistrationUpdate):
    updated = await registration_service.update_registration(reg_id, data)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update registration")
    return RegistrationResponse(data=updated)

@router.delete("/api/admin/registrations/{reg_id}")
async def delete_registration(reg_id: str):
    success = await registration_service.delete_registration(reg_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Registration was not found or was not deleted."
        )
    return {"success": True, "message": f"Registration {reg_id} deleted successfully."}

@router.get("/api/admin/stats", response_model=RegistrationStatsResponse)
async def get_dashboard_stats():
    stats = await registration_service.get_stats()
    return RegistrationStatsResponse(data=stats)
