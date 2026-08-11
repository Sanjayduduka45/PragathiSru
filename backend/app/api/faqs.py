from fastapi import APIRouter, HTTPException
from app.schemas.faq import FAQCreate, FAQUpdate, FAQResponse, FAQListResponse
from app.services.faq_service import faq_service

router = APIRouter()

@router.get("/api/faqs", response_model=FAQListResponse)
async def get_faqs():
    items = await faq_service.get_faqs()
    return FAQListResponse(data=items)

@router.post("/api/admin/faqs", response_model=FAQResponse)
async def create_faq(data: FAQCreate):
    created = await faq_service.create_faq(data)
    return FAQResponse(data=created)

@router.put("/api/admin/faqs/{faq_id}", response_model=FAQResponse)
async def update_faq(faq_id: str, data: FAQUpdate):
    updated = await faq_service.update_faq(faq_id, data)
    return FAQResponse(data=updated)

@router.delete("/api/admin/faqs/{faq_id}")
async def delete_faq(faq_id: str):
    success = await faq_service.delete_faq(faq_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete FAQ")
    return {"success": True, "message": "FAQ deleted successfully."}
