import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas.sponsor import SponsorCreate, SponsorUpdate, SponsorResponse, SponsorListResponse, SponsorUploadResponse
from app.services.sponsor_service import sponsor_service

router = APIRouter()

@router.get("/api/sponsors", response_model=SponsorListResponse)
async def get_sponsors():
    items = await sponsor_service.get_sponsors()
    return SponsorListResponse(data=items)

@router.post("/api/admin/sponsors/upload", response_model=SponsorUploadResponse)
async def upload_sponsor_logo(file: UploadFile = File(...)):
    content_type = file.content_type or ""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"]
    if not any(content_type.startswith(t) for t in allowed_types) and not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.svg')):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format ({content_type}). Please upload a PNG, JPG, WEBP, or SVG image."
        )

    contents = await file.read()
    file_size = len(contents)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file content uploaded.")
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image file exceeds maximum allowed size of 5MB ({file_size / 1024 / 1024:.1f}MB).")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "png"
    unique_name = f"logo_{uuid.uuid4().hex[:12]}.{ext}"
    public_url = await sponsor_service.upload_sponsor_logo(unique_name, contents, content_type or f"image/{ext}")

    if not public_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to upload image to storage. Check database/storage connection."
        )

    return SponsorUploadResponse(
        success=True,
        url=public_url,
        filename=unique_name
    )

@router.post("/api/admin/sponsors", response_model=SponsorResponse)
async def create_sponsor(data: SponsorCreate):
    created = await sponsor_service.create_sponsor(data)
    return SponsorResponse(data=created)

@router.put("/api/admin/sponsors/{sponsor_id}", response_model=SponsorResponse)
async def update_sponsor(sponsor_id: str, data: SponsorUpdate):
    updated = await sponsor_service.update_sponsor(sponsor_id, data)
    return SponsorResponse(data=updated)

@router.delete("/api/admin/sponsors/{sponsor_id}")
async def delete_sponsor(sponsor_id: str):
    success = await sponsor_service.delete_sponsor(sponsor_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete sponsor")
    return {"success": True, "message": "Sponsor deleted successfully."}
