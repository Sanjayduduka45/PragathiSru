from fastapi import APIRouter
from app.schemas.contact import ContactDetails, ContactResponse
from app.services.contact_service import contact_service

router = APIRouter()

@router.get("/api/contact", response_model=ContactResponse)
async def get_contact():
    details = await contact_service.get_contact_details()
    return ContactResponse(data=details)

@router.put("/api/admin/contact", response_model=ContactResponse)
async def update_contact(data: ContactDetails):
    updated = await contact_service.update_contact_details(data)
    return ContactResponse(data=updated)
