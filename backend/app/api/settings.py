from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.schemas.settings import (
    FullSettingsUpdate,
    SettingsResponse,
    UserRoleCreate,
    UserRoleUpdate,
    UserRolesResponse,
    UserRoleSingleResponse,
    AuditLogsResponse
)
from app.services.settings_service import settings_service

router = APIRouter()

# ─── SYSTEM SETTINGS ENDPOINTS ──────────────────────────────────────────────────

@router.get("/api/admin/settings", response_model=SettingsResponse)
async def get_system_settings():
    settings = await settings_service.get_settings()
    return SettingsResponse(data=settings, message="Settings retrieved successfully.")

@router.put("/api/admin/settings", response_model=SettingsResponse)
async def update_system_settings(updates: FullSettingsUpdate):
    updated = await settings_service.update_settings(updates, updated_by="admin")
    return SettingsResponse(data=updated, message="System settings updated successfully.")

@router.post("/api/admin/settings/reset", response_model=SettingsResponse)
async def reset_system_settings(section: Optional[str] = Query(None, description="Section to reset: 'event', 'notifications', 'system', or 'all'")):
    reset_data = await settings_service.reset_settings(section=section, updated_by="admin")
    return SettingsResponse(data=reset_data, message=f"Settings reset successfully ({section or 'all'}).")

# ─── ROLES & PERMISSION MANAGEMENT ENDPOINTS ──────────────────────────────────

@router.get("/api/admin/roles", response_model=UserRolesResponse)
async def get_user_roles():
    roles = await settings_service.get_roles()
    return UserRolesResponse(data=roles)

@router.post("/api/admin/roles", response_model=UserRoleSingleResponse)
async def create_user_role(data: UserRoleCreate):
    if not data.user_email or "@" not in data.user_email:
        raise HTTPException(status_code=400, detail="A valid user email address is required.")
    if data.role not in ('admin', 'coordinator', 'jury', 'participant'):
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be 'admin', 'coordinator', 'jury', or 'participant'.")
    created = await settings_service.create_role(data, assigned_by="admin")
    return UserRoleSingleResponse(data=created, message=f"Role '{data.role}' assigned to {data.user_email}.")

@router.put("/api/admin/roles/{role_id}", response_model=UserRoleSingleResponse)
async def update_user_role(role_id: str, data: UserRoleUpdate):
    if data.role and data.role not in ('admin', 'coordinator', 'jury', 'participant'):
        raise HTTPException(status_code=400, detail="Invalid role specified.")
    updated = await settings_service.update_role(role_id, data, performed_by="admin")
    if not updated:
        raise HTTPException(status_code=404, detail="Role assignment not found.")
    return UserRoleSingleResponse(data=updated, message="Role assignment updated successfully.")

@router.delete("/api/admin/roles/{role_id}")
async def delete_user_role(role_id: str):
    await settings_service.delete_role(role_id, performed_by="admin")
    return {"success": True, "message": "Role assignment revoked successfully."}

# ─── AUDIT LOGS ENDPOINTS ─────────────────────────────────────────────────────

@router.get("/api/admin/audit-logs", response_model=AuditLogsResponse)
async def get_audit_logs(limit: int = Query(30, ge=1, le=100)):
    logs = await settings_service.get_audit_logs(limit=limit)
    return AuditLogsResponse(data=logs)
