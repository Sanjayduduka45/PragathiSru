from fastapi import APIRouter, HTTPException
from app.schemas.domain import DomainCreate, DomainUpdate, DomainResponse, DomainListResponse
from app.services.domain_service import domain_service

router = APIRouter()

@router.get("/api/domains", response_model=DomainListResponse)
async def get_domains():
    items = await domain_service.get_domains()
    return DomainListResponse(data=items)

@router.post("/api/admin/domains", response_model=DomainResponse)
async def create_domain(data: DomainCreate):
    created = await domain_service.create_domain(data)
    return DomainResponse(data=created)

@router.put("/api/admin/domains/{domain_id}", response_model=DomainResponse)
async def update_domain(domain_id: str, data: DomainUpdate):
    updated = await domain_service.update_domain(domain_id, data)
    return DomainResponse(data=updated)

@router.delete("/api/admin/domains/{domain_id}")
async def delete_domain(domain_id: str):
    success = await domain_service.delete_domain(domain_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete domain")
    return {"success": True, "message": "Domain deleted successfully."}
