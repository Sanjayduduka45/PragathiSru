from pydantic import BaseModel

class AboutContent(BaseModel):
    title: str
    description: str
    vision: str = ""
    objectives: str = ""

class AboutResponse(BaseModel):
    success: bool = True
    data: AboutContent
