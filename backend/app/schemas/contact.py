from pydantic import BaseModel
from typing import Optional, List

class ContactDetails(BaseModel):
    contact_email: Optional[str] = "pragathi2k26@sru.edu.in"
    helpline: Optional[str] = "+91 870 281 8333"
    institution: Optional[str] = "SR University"
    venue: Optional[str] = "SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371"
    linkedin_url: Optional[str] = "https://www.linkedin.com/in/sru-pragathi-73a876429/"
    facebook_url: Optional[str] = "https://www.facebook.com/share/19D3TK5Yae/"
    instagram_url: Optional[str] = "https://www.instagram.com/sru.pragathi2.0?igsh=dng0ZXR2Y2g2enU1"

class ContactResponse(BaseModel):
    success: bool = True
    data: ContactDetails
    message: Optional[str] = None

class ContactPerson(BaseModel):
    id: str
    category: str  # 'leadership' | 'coordinator'
    name: str
    designation: str
    mobile: str
    email: Optional[str] = ""
    display_order: int = 1
    is_active: bool = True

class ContactPersonCreate(BaseModel):
    category: str
    name: str
    designation: str
    mobile: str
    email: Optional[str] = ""
    display_order: Optional[int] = 1
    is_active: Optional[bool] = True

class ContactPersonUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    designation: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class ContactPeopleResponse(BaseModel):
    success: bool = True
    data: List[ContactPerson]
    message: Optional[str] = None

class ContactPersonSingleResponse(BaseModel):
    success: bool = True
    data: ContactPerson
    message: Optional[str] = None
