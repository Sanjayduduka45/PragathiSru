from pydantic import BaseModel
from typing import Optional

class AboutContent(BaseModel):
    title: str
    description: str
    vision: str = ""
    objectives: str = ""
    is_override: Optional[bool] = False

class AboutResponse(BaseModel):
    success: bool = True
    data: AboutContent
    message: Optional[str] = None
