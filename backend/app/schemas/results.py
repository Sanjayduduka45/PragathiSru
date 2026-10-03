from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class IndividualEvaluation(BaseModel):
    id: str
    judge_id: str
    judge_name: str
    judge_email: str
    total_score: float
    scores: Dict[str, float] = Field(default_factory=dict)
    comments: Optional[str] = None
    submitted_at: str

class ProjectResultItem(BaseModel):
    registration_id: str
    team_name: str
    project_title: str
    category: str
    institution_name: str
    leader_name: str
    problem_statement: Optional[str] = None
    proposed_solution: Optional[str] = None
    innovation: Optional[str] = None
    members: List[Dict[str, Any]] = Field(default_factory=list)
    evaluations_count: int = 0
    raw_average: float = 0.0
    criteria_averages: Dict[str, float] = Field(default_factory=dict)
    theme_min: Optional[float] = None
    theme_max: Optional[float] = None
    normalized_score: Optional[float] = None
    merit_score: Optional[float] = None
    overall_rank: Optional[int] = None
    theme_rank: Optional[int] = None
    award: Optional[str] = None
    award_type: Optional[str] = None  # 'overall' | 'theme' | None
    status: str = "Not Evaluated"      # 'Provisional' | 'Not Evaluated'
    is_eligible: bool = False
    tie_status: str = "none"           # 'none' | 'resolved' | 'committee_review_required'
    evaluations: List[IndividualEvaluation] = Field(default_factory=list)

class AwardWinnerItem(BaseModel):
    award_name: str
    award_scope: str                   # 'overall' | 'theme'
    category: str
    registration_id: str
    team_name: str
    project_title: str
    raw_average: float
    normalized_score: Optional[float] = None
    merit_score: Optional[float] = None
    overall_rank: Optional[int] = None
    theme_rank: Optional[int] = None
    tie_status: str = "none"
    is_disputed: bool = False
    disputed_teams: List[Dict[str, Any]] = Field(default_factory=list)

class ThemeSummaryItem(BaseModel):
    category: str
    total_projects: int
    evaluated_projects: int
    theme_min: Optional[float] = None
    theme_max: Optional[float] = None
    theme_first: Optional[AwardWinnerItem] = None
    theme_second: Optional[AwardWinnerItem] = None

class ResultsStats(BaseModel):
    total_projects: int = 0
    evaluated_projects: int = 0
    not_evaluated_projects: int = 0
    total_evaluations: int = 0
    highest_raw_score: float = 0.0
    highest_merit_score: float = 0.0

class AdminResultsResponse(BaseModel):
    success: bool = True
    mode: str = "Provisional"
    notice: str = (
        "Provisional Results — calculated from currently submitted evaluations. "
        "Final eligibility will use assigned-jury completion after Jury Assignment is configured."
    )
    stats: ResultsStats
    themes: List[ThemeSummaryItem] = Field(default_factory=list)
    awards: List[AwardWinnerItem] = Field(default_factory=list)
    projects: List[ProjectResultItem] = Field(default_factory=list)
    calculated_at: str

class DeleteEvaluationResponse(BaseModel):
    success: bool
    message: str
    deleted_id: str
