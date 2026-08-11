from pydantic import BaseModel
from typing import Optional, List

class FAQItem(BaseModel):
    id: str
    question: str
    answer: str
    category: str = "General"
    active: bool = True
    order: int = 0

class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str = "General"
    active: bool = True
    order: int = 0

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    active: Optional[bool] = None
    order: Optional[int] = None

class FAQResponse(BaseModel):
    success: bool = True
    data: FAQItem

class FAQListResponse(BaseModel):
    success: bool = True
    data: List[FAQItem]
