from fastapi import APIRouter, HTTPException
from app.schemas.testimonial import (
    TestimonialCreate,
    TestimonialUpdate,
    TestimonialResponse,
    TestimonialListResponse
)
from app.services.testimonial_service import testimonial_service

router = APIRouter()

@router.get("/api/testimonials", response_model=TestimonialListResponse)
@router.get("/api/admin/testimonials", response_model=TestimonialListResponse)
async def get_testimonials():
    items = await testimonial_service.get_testimonials()
    return TestimonialListResponse(data=items)

@router.post("/api/admin/testimonials", response_model=TestimonialResponse)
async def create_testimonial(data: TestimonialCreate):
    created = await testimonial_service.create_testimonial(data)
    return TestimonialResponse(data=created)

@router.put("/api/admin/testimonials/{testimonial_id}", response_model=TestimonialResponse)
async def update_testimonial(testimonial_id: str, data: TestimonialUpdate):
    updated = await testimonial_service.update_testimonial(testimonial_id, data)
    return TestimonialResponse(data=updated)

@router.delete("/api/admin/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str):
    success = await testimonial_service.delete_testimonial(testimonial_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete testimonial")
    return {"success": True, "message": "Testimonial deleted successfully."}
