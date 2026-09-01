from pydantic import BaseModel
from typing import Optional, List

class SponsorItem(BaseModel):
    id: str
    name: str
    type: str = "Partner"
    role: str = ""
    logo_text: str = ""
    logo_url: str = ""
    website: str = ""
    active: bool = True
    order: int = 0

class SponsorCreate(BaseModel):
    name: str
    type: str = "Partner"
    role: str = ""
    logo_text: str = ""
    logo_url: str = ""
    website: str = ""
    active: bool = True
    order: int = 0

class SponsorUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    role: Optional[str] = None
    logo_text: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    active: Optional[bool] = None
    order: Optional[int] = None

class SponsorUploadResponse(BaseModel):
    success: bool = True
    url: str
    filename: str

class SponsorResponse(BaseModel):
    success: bool = True
    data: SponsorItem

class SponsorListResponse(BaseModel):
    success: bool = True
    data: List[SponsorItem]
