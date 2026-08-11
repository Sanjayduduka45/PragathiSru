from pydantic import BaseModel
from typing import Optional, List

class ScheduleItem(BaseModel):
    id: str
    time: str
    event: str
    location: str = ""
    description: str = ""
    badge: str = ""
    active: bool = True
    display_order: int = 0

class ScheduleCreate(BaseModel):
    time: str
    event: str
    location: str = ""
    description: str = ""
    badge: str = ""
    active: bool = True
    display_order: int = 0

class ScheduleUpdate(BaseModel):
    time: Optional[str] = None
    event: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    badge: Optional[str] = None
    active: Optional[bool] = None
    display_order: Optional[int] = None

class ScheduleResponse(BaseModel):
    success: bool = True
    data: ScheduleItem

class ScheduleListResponse(BaseModel):
    success: bool = True
    data: List[ScheduleItem]
