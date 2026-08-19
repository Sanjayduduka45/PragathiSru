from pydantic import BaseModel
from typing import Optional, List, Any

class TeamMember(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    mobile: Optional[str] = None
    roll_number: Optional[str] = None
    department: Optional[str] = None
    is_team_leader: Optional[bool] = False

class ProjectInfo(BaseModel):
    id: Optional[str] = None
    title: str = "Untitled Project"
    category: str = "General"
    problem_statement: Optional[str] = None

class InstitutionInfo(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    institution_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"

class RegistrationItem(BaseModel):
    id: str
    registration_id: str
    team_name: str
    participant_type: str
    team_size: int
    leader_name: str
    leader_email: str
    leader_mobile: Optional[str] = None
    registration_status: str = "submitted"
    payment_status: str = "not_required"
    payment_amount: Optional[float] = 0
    payment_reference: Optional[str] = None
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    institution_type: Optional[str] = None
    institutions: Optional[InstitutionInfo] = None
    team_members: Optional[List[TeamMember]] = []
    projects: Optional[List[ProjectInfo]] = []
    created_at: Optional[str] = None

class RegistrationUpdate(BaseModel):
    team_name: Optional[str] = None
    participant_type: Optional[str] = None
    leader_name: Optional[str] = None
    leader_email: Optional[str] = None
    leader_mobile: Optional[str] = None
    registration_status: Optional[str] = None
    payment_status: Optional[str] = None
    payment_amount: Optional[float] = None
    payment_reference: Optional[str] = None
    team_members: Optional[List[TeamMember]] = None
    projects: Optional[List[ProjectInfo]] = None

class RegistrationStats(BaseModel):
    total: int
    free: int
    paid: int
    pending: int = 0
    domains_count: int
    faqs_count: int

class RegistrationStatsResponse(BaseModel):
    success: bool = True
    data: RegistrationStats

class RegistrationResponse(BaseModel):
    success: bool = True
    data: RegistrationItem

class RegistrationListResponse(BaseModel):
    success: bool = True
    data: List[RegistrationItem]

class EmailLogItem(BaseModel):
    id: Optional[str] = None
    registration_id: Optional[str] = None
    registration_code: Optional[str] = None
    member_id: Optional[str] = None
    recipient_name: str
    recipient_email: str
    recipient_role: str
    email_type: str = "registration_confirmation"
    subject: str
    status: str
    provider: Optional[str] = "resend"
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: Optional[str] = None
    created_at: Optional[str] = None

class EmailLogListResponse(BaseModel):
    success: bool = True
    data: List[EmailLogItem]

class ResendEmailResponse(BaseModel):
    success: bool
    message: str
    results: Optional[Any] = None

