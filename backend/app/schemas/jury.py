from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ─── Jury Account Schemas ──────────────────────────────────────────────────────

class JuryProfile(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    department: str = ""
    is_active: bool = True
    evaluations_completed: int = 0
    assigned_domains_count: int = 0
    created_at: Optional[str] = None

class UpdateJuryProfileRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

# ─── Domain Assignment Schemas ────────────────────────────────────────────────

class CreateDomainAssignmentRequest(BaseModel):
    domain_id: str
    assignment_mode: str = Field(default="ALL", description="'ALL' or 'SELECTED'")

class UpdateDomainAssignmentRequest(BaseModel):
    assignment_mode: Optional[str] = None
    is_active: Optional[bool] = None

class DomainAssignmentItem(BaseModel):
    id: str
    judge_user_id: str
    domain_id: str
    domain_title: str
    assignment_mode: str  # 'ALL' | 'SELECTED'
    is_active: bool
    selected_projects_count: int = 0
    created_at: str

class ProjectAssignmentItem(BaseModel):
    id: str
    jury_domain_assignment_id: str
    registration_id: str
    project_title: str
    team_name: str
    created_at: str

class AddProjectAssignmentsRequest(BaseModel):
    registration_ids: List[str]

class AssignmentCandidateItem(BaseModel):
    registration_id: str
    project_title: str
    team_name: str = ""
    institution: str = ""
    canonical_domain_id: str
    domain_title: str
    is_assigned: bool = False
    assigned_to_judge_id: Optional[str] = None
    assigned_to_judge_name: Optional[str] = None
    available: bool = True

class AssignmentCandidatesResponse(BaseModel):
    success: bool = True
    domain_id: str
    domain_title: str
    available_count: int = 0
    already_assigned_count: int = 0
    candidates: List[AssignmentCandidateItem] = Field(default_factory=list)

class CreateJuryAccountRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    department: str = Field(..., min_length=2)
    temporaryPassword: str = Field(..., min_length=8, max_length=72)
    isActive: bool = True

class MarksExportItem(BaseModel):
    registration_id: str
    project_title: str
    team_name: str = ""
    institution: str = ""
    department: str = ""
    canonical_theme: str
    domain_id: str
    assigned_jury_name: Optional[str] = None
    evaluation_status: str  # 'Evaluated' | 'Pending'
    criteria_innovation: Optional[float] = None
    criteria_technical: Optional[float] = None
    criteria_prototype: Optional[float] = None
    criteria_impact: Optional[float] = None
    criteria_presentation: Optional[float] = None
    raw_total: Optional[float] = None
    evaluated_at: Optional[str] = None

class MarksExportResponse(BaseModel):
    success: bool = True
    total_projects: int = 0
    evaluated_count: int = 0
    pending_count: int = 0
    records: List[MarksExportItem] = Field(default_factory=list)

class JuryAssignmentsResponse(BaseModel):
    success: bool = True
    judge_user_id: str
    assignments: List[DomainAssignmentItem] = Field(default_factory=list)

# ─── Project Completion Schemas ────────────────────────────────────────────────

class ProjectCompletionItem(BaseModel):
    registration_id: str
    team_name: str
    project_title: str
    category: str
    domain_id: Optional[str] = None
    domain_title: Optional[str] = None
    assigned_juries: List[Dict[str, Any]] = Field(default_factory=list)
    submitted_juries: List[Dict[str, Any]] = Field(default_factory=list)
    assigned_count: int = 0
    submitted_count: int = 0
    status: str  # 'UNASSIGNED' | 'NOT_EVALUATED' | 'IN_PROGRESS' | 'COMPLETED'

class JuryCompletionOverviewResponse(BaseModel):
    success: bool = True
    total_projects: int = 0
    completed_projects: int = 0
    in_progress_projects: int = 0
    not_evaluated_projects: int = 0
    unassigned_projects: int = 0
    projects: List[ProjectCompletionItem] = Field(default_factory=list)

# ─── Assigned Projects for Logged-In Jury ──────────────────────────────────────

class AssignedProjectItem(BaseModel):
    registration_id: str
    team_name: str
    project_title: str
    category: str
    institution_name: str
    leader_name: str
    members: List[Dict[str, Any]] = Field(default_factory=list)
    problem_statement: Optional[str] = None
    proposed_solution: Optional[str] = None
    innovation: Optional[str] = None
    expected_outcomes: Optional[str] = None
    is_evaluated: bool = False
    evaluation_id: Optional[str] = None
    assignment_mode: str = "ALL"  # 'ALL' | 'SELECTED'
    domain_id: Optional[str] = None
    domain_title: Optional[str] = None
    evaluation_status: str = "PENDING"  # 'EVALUATED' | 'PENDING'
    total_score: Optional[float] = None
    submitted_at: Optional[str] = None

class AssignedProjectsResponse(BaseModel):
    success: bool = True
    judge_user_id: str
    total_assigned: int = 0
    completed_count: int = 0
    pending_count: int = 0
    projects: List[AssignedProjectItem] = Field(default_factory=list)

# ─── Jury Bootstrap Schemas ───────────────────────────────────────────────────

class JuryBootstrapProfile(BaseModel):
    user_id: str
    name: str
    email: str
    department: str = ""
    is_active: bool = True

class JuryBootstrapSummary(BaseModel):
    assigned: int = 0
    evaluated: int = 0
    remaining: int = 0

class JuryBootstrapResponse(BaseModel):
    success: bool = True
    jury: JuryBootstrapProfile
    assignments: List[DomainAssignmentItem] = Field(default_factory=list)
    projects: List[AssignedProjectItem] = Field(default_factory=list)
    summary: JuryBootstrapSummary
    evaluations: List[Dict[str, Any]] = Field(default_factory=list)

# ─── Evaluation Reset Schemas ─────────────────────────────────────────────────

class ResetEvaluationRequest(BaseModel):
    reset_reason: str = Field(..., min_length=3, description="Mandatory administrative justification for resetting evaluation")

# ─── Jury Project Progress Schemas (Admin) ────────────────────────────────────

class JuryProjectProgressItem(BaseModel):
    registration_id: str
    project_title: str
    team_name: str
    domain_id: Optional[str] = None
    domain_title: Optional[str] = None
    assignment_mode: str = "ALL"  # 'ALL' | 'SELECTED'
    evaluation_status: str = "PENDING"  # 'EVALUATED' | 'PENDING'
    total_score: Optional[float] = None
    submitted_at: Optional[str] = None

class JuryProjectProgressResponse(BaseModel):
    success: bool = True
    jury_user_id: str
    assigned_projects: int = 0
    evaluated_projects: int = 0
    remaining_projects: int = 0
    projects: List[JuryProjectProgressItem] = Field(default_factory=list)
