from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.contact import (
    ContactDetails,
    ContactResponse,
    ContactPerson,
    ContactPersonCreate,
    ContactPersonUpdate,
    ContactPeopleResponse,
    ContactPersonSingleResponse
)
from app.services.contact_service import contact_service

router = APIRouter()

# ─── CONTACT SETTINGS ───────────────────────────────────────────────────────────
@router.get("/api/contact", response_model=ContactResponse)
@router.get("/api/contact/settings", response_model=ContactResponse)
async def get_contact():
    details = await contact_service.get_contact_details()
    return ContactResponse(data=details)

@router.put("/api/admin/contact", response_model=ContactResponse)
@router.put("/api/admin/contact/settings", response_model=ContactResponse)
async def update_contact(data: ContactDetails):
    updated = await contact_service.update_contact_details(data)
    return ContactResponse(data=updated, message="Contact settings updated successfully.")

# ─── CONTACT PEOPLE CRUD ───────────────────────────────────────────────────────
@router.get("/api/contact/people", response_model=ContactPeopleResponse)
async def get_contact_people():
    people = await contact_service.get_contact_people()
    return ContactPeopleResponse(data=people)

@router.post("/api/admin/contact/people", response_model=ContactPersonSingleResponse)
async def create_contact_person(data: ContactPersonCreate):
    if not data.name or not data.designation or not data.mobile:
        raise HTTPException(status_code=400, detail="Name, designation, and phone number are required.")
    created = await contact_service.create_contact_person(data)
    return ContactPersonSingleResponse(data=created, message="Contact person added successfully.")

@router.put("/api/admin/contact/people/{person_id}", response_model=ContactPersonSingleResponse)
async def update_contact_person(person_id: str, data: ContactPersonUpdate):
    updated = await contact_service.update_contact_person(person_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Contact person not found.")
    return ContactPersonSingleResponse(data=updated, message="Contact person updated successfully.")

@router.delete("/api/admin/contact/people/{person_id}")
async def delete_contact_person(person_id: str):
    await contact_service.delete_contact_person(person_id)
    return {"success": True, "message": "Contact person deleted successfully."}
