from pydantic import BaseModel
from typing import Optional, List

class TestimonialItem(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    person_name: Optional[str] = ""
    designation: str = ""
    event_name: str = ""
    event_year: str = ""
    image_url: str = ""
    image_alt: str = ""
    image_aspect_ratio: str = "16:9"
    image_position: str = "center"
    media_type: str = "image"
    media_url: str = ""
    thumbnail_url: str = ""
    is_active: bool = True
    display_order: int = 0

class TestimonialCreate(BaseModel):
    title: str = ""
    description: str = ""
    person_name: Optional[str] = ""
    designation: str = ""
    event_name: str = ""
    event_year: str = ""
    image_url: str = ""
    image_alt: str = ""
    image_aspect_ratio: str = "16:9"
    image_position: str = "center"
    media_type: str = "image"
    media_url: str = ""
    thumbnail_url: str = ""
    is_active: bool = True
    display_order: int = 0

class TestimonialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    person_name: Optional[str] = None
    designation: Optional[str] = None
    event_name: Optional[str] = None
    event_year: Optional[str] = None
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    image_aspect_ratio: Optional[str] = None
    image_position: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class TestimonialResponse(BaseModel):
    success: bool = True
    data: TestimonialItem

class TestimonialListResponse(BaseModel):
    success: bool = True
    data: List[TestimonialItem]
