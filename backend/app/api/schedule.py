from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, Header, Depends
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse, ScheduleListResponse
from app.services.schedule_service import schedule_service
from app.database import db
from app.config import settings

router = APIRouter()

async def verify_admin_user(
    authorization: Optional[str] = Header(None),
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret")
) -> bool:
    # 1. Direct shared admin secret or service key match
    effective_key = settings.get_effective_key()
    if x_admin_secret and (x_admin_secret == settings.admin_secret_key or x_admin_secret == effective_key):
        return True

    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()

    if token and (token == settings.admin_secret_key or token == effective_key):
        return True

    # 2. Supabase Auth JWT verification
    if token:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{settings.supabase_url}/auth/v1/user",
                    headers={
                        "apikey": effective_key,
                        "Authorization": f"Bearer {token}"
                    }
                )
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")

            user_data = res.json()
            user_id = user_data.get("id")

            # Check role in public.user_roles (database source of truth)
            supa_roles = await db.fetch_supabase("user_roles", f"user_id=eq.{user_id}&limit=1")
            if supa_roles and len(supa_roles) > 0:
                role = str(supa_roles[0].get("role", "")).lower()
                is_active = supa_roles[0].get("is_active", True)
                if role in ("admin", "superadmin", "coordinator") and (is_active is None or is_active is True):
                    return True

            # Fallback to user_metadata
            meta_role = str(user_data.get("user_metadata", {}).get("role", "")).lower()
            if meta_role in ("admin", "superadmin", "coordinator"):
                return True

            # Authenticated, but lacking admin privileges
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Administrator privileges required to modify schedule items."
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

    raise HTTPException(status_code=401, detail="Unauthorized: Admin authentication required.")

@router.get("/api/schedule", response_model=ScheduleListResponse)
@router.get("/api/admin/schedule", response_model=ScheduleListResponse)
async def get_schedule():
    items = await schedule_service.get_schedule()
    return ScheduleListResponse(data=items)

@router.post("/api/admin/schedule", response_model=ScheduleResponse)
async def create_schedule_item(
    data: ScheduleCreate,
    _admin: bool = Depends(verify_admin_user)
):
    created = await schedule_service.create_schedule_item(data)
    return ScheduleResponse(data=created)

@router.put("/api/admin/schedule/{item_id}", response_model=ScheduleResponse)
async def update_schedule_item(
    item_id: str,
    data: ScheduleUpdate,
    _admin: bool = Depends(verify_admin_user)
):
    updated = await schedule_service.update_schedule_item(item_id, data)
    return ScheduleResponse(data=updated)

@router.delete("/api/admin/schedule/{item_id}")
async def delete_schedule_item(
    item_id: str,
    _admin: bool = Depends(verify_admin_user)
):
    success = await schedule_service.delete_schedule_item(item_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete schedule item")
    return {"success": True, "message": "Schedule item deleted successfully."}
