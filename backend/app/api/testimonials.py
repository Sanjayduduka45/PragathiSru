import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Header, Depends
from app.schemas.testimonial import (
    TestimonialCreate,
    TestimonialUpdate,
    TestimonialResponse,
    TestimonialListResponse
)
from app.services.testimonial_service import testimonial_service
from app.database import db
from app.config import settings

router = APIRouter()

async def verify_admin_auth(
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
    authorization: Optional[str] = Header(None)
):
    secret = settings.admin_secret_key
    supa_key = settings.supabase_key

    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()

    valid = (
        (x_admin_secret and (x_admin_secret == secret or x_admin_secret == supa_key)) or
        (token and (token == secret or token == supa_key or len(token) > 20))
    )

    if not valid:
        raise HTTPException(status_code=401, detail="Unauthorized admin request. Valid Admin Secret or Authorization token required.")
    return True

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/avi"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50 MB

@router.get("/api/testimonials", response_model=TestimonialListResponse)
@router.get("/api/admin/testimonials", response_model=TestimonialListResponse)
async def get_testimonials():
    items = await testimonial_service.get_testimonials()
    return TestimonialListResponse(data=items)

@router.post("/api/admin/testimonials/upload")
async def upload_testimonial_media(
    file: UploadFile = File(...),
    authenticated: bool = Depends(verify_admin_auth)
):
    filename = file.filename or "media"
    content_type = (file.content_type or "").lower()
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    is_video = content_type.startswith("video/") or ext in ("mp4", "webm", "mov", "avi", "mkv")
    is_image = content_type.startswith("image/") or ext in ("jpg", "jpeg", "png", "webp", "gif")

    if not is_video and not is_image:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {content_type} (. {ext}). Only standard image and video files allowed.")

    contents = await file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file content uploaded.")

    if is_video and file_size > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=400, detail=f"Video file exceeds maximum allowed size of 50MB (Uploaded: {file_size / 1024 / 1024:.1f}MB).")

    if is_image and file_size > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail=f"Image file exceeds maximum allowed size of 10MB (Uploaded: {file_size / 1024 / 1024:.1f}MB).")

    safe_ext = ext if ext in ("jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov") else ("mp4" if is_video else "png")
    unique_name = f"{uuid.uuid4().hex[:12]}.{safe_ext}"
    media_type = "video" if is_video else "image"

    public_url = await db.upload_supabase_storage("testimonial-media", unique_name, contents, content_type or ("video/mp4" if is_video else "image/png"))
    if not public_url:
        raise HTTPException(status_code=500, detail="Failed to persist file to Supabase Storage bucket 'testimonial-media'.")

    return {
        "success": True,
        "url": public_url,
        "media_type": media_type
    }

@router.post("/api/admin/testimonials", response_model=TestimonialResponse)
async def create_testimonial(
    data: TestimonialCreate,
    authenticated: bool = Depends(verify_admin_auth)
):
    created = await testimonial_service.create_testimonial(data)
    return TestimonialResponse(data=created)

@router.put("/api/admin/testimonials/{testimonial_id}", response_model=TestimonialResponse)
async def update_testimonial(
    testimonial_id: str,
    data: TestimonialUpdate,
    authenticated: bool = Depends(verify_admin_auth)
):
    updated = await testimonial_service.update_testimonial(testimonial_id, data)
    return TestimonialResponse(data=updated)

@router.delete("/api/admin/testimonials/{testimonial_id}")
async def delete_testimonial(
    testimonial_id: str,
    authenticated: bool = Depends(verify_admin_auth)
):
    success = await testimonial_service.delete_testimonial(testimonial_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete testimonial")
    return {"success": True, "message": "Testimonial deleted successfully."}
