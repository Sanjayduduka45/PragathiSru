from pydantic import BaseModel
from typing import Optional

class EventDetails(BaseModel):
    event_name: str
    full_title: str
    tagline: str
    event_date: str
    target_date_iso: str
    venue: str
    institution: str
    location: str
    prize_pool: str
    contact_email: str
    helpline: str

class EventResponse(BaseModel):
    success: bool = True
    data: EventDetails
