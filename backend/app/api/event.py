from fastapi import APIRouter
from app.schemas.event import EventDetails, EventResponse
from app.services.event_service import event_service

router = APIRouter()

@router.get("/api/event", response_model=EventResponse)
async def get_event():
    details = await event_service.get_event_details()
    return EventResponse(data=details)

@router.put("/api/admin/event", response_model=EventResponse)
async def update_event(data: EventDetails):
    updated = await event_service.update_event_details(data)
    return EventResponse(data=updated)
