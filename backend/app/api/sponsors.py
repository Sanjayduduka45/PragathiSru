from fastapi import APIRouter, HTTPException
from app.schemas.sponsor import SponsorCreate, SponsorUpdate, SponsorResponse, SponsorListResponse
from app.services.sponsor_service import sponsor_service

router = APIRouter()

@router.get("/api/sponsors", response_model=SponsorListResponse)
async def get_sponsors():
    items = await sponsor_service.get_sponsors()
    return SponsorListResponse(data=items)

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
