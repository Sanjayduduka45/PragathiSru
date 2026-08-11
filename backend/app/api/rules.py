from fastapi import APIRouter
from app.schemas.rules import RulesContent, RulesResponse
from app.services.rules_service import rules_service

router = APIRouter()

@router.get("/api/rules", response_model=RulesResponse)
async def get_rules():
    content = await rules_service.get_rules_content()
    return RulesResponse(data=content)

@router.put("/api/admin/rules", response_model=RulesResponse)
async def update_rules(data: RulesContent):
    updated = await rules_service.update_rules_content(data)
    return RulesResponse(data=updated)
