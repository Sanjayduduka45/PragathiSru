from fastapi import APIRouter
from app.schemas.about import AboutContent, AboutResponse
from app.services.about_service import about_service

router = APIRouter()

@router.get("/api/about", response_model=AboutResponse)
async def get_about():
    content = await about_service.get_about_content()
    return AboutResponse(data=content)

@router.put("/api/admin/about", response_model=AboutResponse)
async def update_about(data: AboutContent):
    updated = await about_service.update_about_content(data)
    return AboutResponse(data=updated, message="About content override saved successfully.")

@router.delete("/api/admin/about", response_model=AboutResponse)
async def delete_about():
    restored = await about_service.reset_about_content()
    return AboutResponse(data=restored, message="About content restored to original defaults.")

@router.post("/api/admin/about/reset", response_model=AboutResponse)
async def reset_about():
    restored = await about_service.reset_about_content()
    return AboutResponse(data=restored, message="About content restored to original defaults.")
