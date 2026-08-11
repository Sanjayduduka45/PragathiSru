from fastapi import APIRouter, HTTPException
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse, ScheduleListResponse
from app.services.schedule_service import schedule_service

router = APIRouter()

@router.get("/api/schedule", response_model=ScheduleListResponse)
async def get_schedule():
    items = await schedule_service.get_schedule()
    return ScheduleListResponse(data=items)

@router.post("/api/admin/schedule", response_model=ScheduleResponse)
async def create_schedule_item(data: ScheduleCreate):
    created = await schedule_service.create_schedule_item(data)
    return ScheduleResponse(data=created)

@router.put("/api/admin/schedule/{item_id}", response_model=ScheduleResponse)
async def update_schedule_item(item_id: str, data: ScheduleUpdate):
    updated = await schedule_service.update_schedule_item(item_id, data)
    return ScheduleResponse(data=updated)

@router.delete("/api/admin/schedule/{item_id}")
async def delete_schedule_item(item_id: str):
    success = await schedule_service.delete_schedule_item(item_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete schedule item")
    return {"success": True, "message": "Schedule item deleted successfully."}
