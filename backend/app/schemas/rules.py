from pydantic import BaseModel

class RulesContent(BaseModel):
    content: str

class RulesResponse(BaseModel):
    success: bool = True
    data: RulesContent
