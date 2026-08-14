from pydantic import BaseModel
from typing import Optional

class EventDetails(BaseModel):
    event_name: Optional[str] = "PRAGATHI 2K26"
    full_title: Optional[str] = "PRAGATHI 2K26 — National Level Project Expo"
    tagline: Optional[str] = "Innovate. Create. Inspire."
    event_date: Optional[str] = "09 October 2026"
    target_date_iso: Optional[str] = "2026-10-09T09:00:00+05:30"
    venue: Optional[str] = "SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371"
    institution: Optional[str] = "SR University"
    location: Optional[str] = "Warangal, Telangana"
    prize_pool: Optional[str] = "₹1,50,000"
    contact_email: Optional[str] = "pragathi2k26@sru.edu.in"
    helpline: Optional[str] = "+91 870 281 8333"
    linkedin_url: Optional[str] = "https://www.linkedin.com/in/sru-pragathi-73a876429/"
    facebook_url: Optional[str] = "https://www.facebook.com/share/19D3TK5Yae/"
    instagram_url: Optional[str] = "https://www.instagram.com/sru.pragathi2.0?igsh=dng0ZXR2Y2g2enU1"

class EventResponse(BaseModel):
    success: bool = True
    data: EventDetails
    message: Optional[str] = None
