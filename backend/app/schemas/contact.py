from pydantic import BaseModel

class ContactDetails(BaseModel):
    contact_email: str
    helpline: str
    institution: str
    venue: str

class ContactResponse(BaseModel):
    success: bool = True
    data: ContactDetails
