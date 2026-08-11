from pydantic import BaseModel
from typing import Optional, List

class DomainItem(BaseModel):
    id: str
    title: str
    description: str
    icon_name: str = "Cpu"
    color: str = "from-blue-600 to-indigo-600"
    badge_text: str = ""
    active: bool = True
    display_order: int = 0

class DomainCreate(BaseModel):
    title: str
    description: str
    icon_name: str = "Cpu"
    color: str = "from-blue-600 to-indigo-600"
    badge_text: str = ""
    active: bool = True
    display_order: int = 0

class DomainUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    icon_name: Optional[str] = None
    color: Optional[str] = None
    badge_text: Optional[str] = None
    active: Optional[bool] = None
    display_order: Optional[int] = None

class DomainResponse(BaseModel):
    success: bool = True
    data: DomainItem

class DomainListResponse(BaseModel):
    success: bool = True
    data: List[DomainItem]
