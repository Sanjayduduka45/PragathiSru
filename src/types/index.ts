/**
 * PRAGATHI 2K26 - Standardized Frontend Types
 * Single source of truth for all domain interfaces.
 */

// ─── ROLES & USERS ─────────────────────────────────────────────────────────────

export type AppRole = 'admin' | 'jury' | 'judge' | 'participant';

export interface User {
  id: string;
  email: string;
  role: AppRole;
  displayName: string;
  isActive: boolean;
  department?: string;
  createdAt?: string;
  lastSignInAt?: string | null;
}

export interface Judge {
  id: string;
  userId?: string;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
  evaluationsCompleted: number;
  lastEvaluationAt?: string | null;
  createdAt?: string;
}

export type Jury = Judge;

export interface CreateJudgeInput {
  name: string;
  email: string;
  department?: string;
  temporaryPassword?: string;
  isActive?: boolean;
}

export type CreateJuryInput = CreateJudgeInput;

export interface JudgeStats {
  totalJudges: number;
  activeJudges: number;
  totalEvaluations: number;
  pendingEvaluations: number;
}

export type JuryStats = JudgeStats;

// ─── PARTICIPANTS & PROJECTS ───────────────────────────────────────────────────

export interface ParticipantMember {
  name: string;
  email: string;
  phone?: string;
  role: 'Leader' | 'Member';
  rollNumber?: string;
  department?: string;
  classOrYear?: string;
}

export interface Project {
  id: string;
  registrationId: string;
  teamName: string;
  title: string;
  category: string;
  institutionName: string;
  leaderName: string;
  leaderEmail: string;
  members: ParticipantMember[];
  problemStatement?: string;
  proposedSolution?: string;
  innovation?: string;
  expectedOutcomes?: string;
  posterUrl?: string | null;
  status: string;
}

// ─── EVALUATIONS ──────────────────────────────────────────────────────────────

export interface EvaluationCriterion {
  id: string;
  key: string;
  label: string;
  description: string;
  maxScore: number;
  displayOrder: number;
}

export interface CriterionScore {
  criterionKey: string;
  score: number;
  maxScore: number;
}

export interface Evaluation {
  id: string;
  registrationId: string;
  projectTitle: string;
  teamName: string;
  category: string;
  judgeId: string;
  judgeEmail: string;
  judgeName: string;
  scores: Record<string, number>; // criterionKey -> score (0-20)
  totalScore: number;             // Total (0-100)
  comments?: string;
  submittedAt: string;
}

export interface SubmitEvaluationPayload {
  registrationId: string;
  projectTitle: string;
  teamName: string;
  category: string;
  judgeId?: string;
  judgeEmail: string;
  judgeName: string;
  scores: Record<string, number>;
  comments?: string;
}

// ─── RESULTS & AGGREGATIONS ───────────────────────────────────────────────────

export interface JudgeScoreBreakdown {
  id?: string;
  judgeId: string;
  judgeName: string;
  judgeEmail: string;
  scores: Record<string, number>;
  totalScore: number;
  comments?: string;
  submittedAt: string;
}

export interface ProjectResult {
  registrationId: string;
  teamName: string;
  projectTitle: string;
  category: string;
  institutionName: string;
  leaderName: string;
  members: ParticipantMember[];
  problemStatement?: string;
  proposedSolution?: string;
  innovation?: string;
  evaluationsCount: number;
  rawAverage: number;
  criteriaAverages?: Record<string, number>;
  themeMin?: number | null;
  themeMax?: number | null;
  normalizedScore?: number | null;
  meritScore?: number | null;
  overallRank?: number | null;
  themeRank?: number | null;
  award?: string | null;
  awardType?: 'overall' | 'theme' | null;
  status: 'Provisional' | 'Not Evaluated' | 'Complete' | 'In Progress';
  isEligible?: boolean;
  tieStatus?: 'none' | 'resolved' | 'committee_review_required';
  evaluations: JudgeScoreBreakdown[];
  // Backwards compatibility aliases
  completedJudges?: number;
  expectedJudges?: number;
  averageScore?: number;
}

export interface AwardWinnerItem {
  award_name: string;
  award_scope: 'overall' | 'theme';
  category: string;
  registration_id: string;
  team_name: string;
  project_title: string;
  raw_average: number;
  normalized_score?: number | null;
  merit_score?: number | null;
  overall_rank?: number | null;
  theme_rank?: number | null;
  tie_status?: 'none' | 'resolved' | 'committee_review_required';
  is_disputed?: boolean;
  disputed_teams?: Array<{ registration_id: string; team_name: string }>;
}

export interface ThemeSummaryItem {
  category: string;
  total_projects: number;
  evaluated_projects: number;
  theme_min?: number | null;
  theme_max?: number | null;
  theme_first?: AwardWinnerItem | null;
  theme_second?: AwardWinnerItem | null;
}

export interface ResultsStats {
  totalProjects: number;
  evaluatedProjects?: number;
  notEvaluatedProjects?: number;
  totalEvaluations?: number;
  highestRawScore?: number;
  highestMeritScore?: number;
  // Legacy aliases
  fullyEvaluated?: number;
  inProgress?: number;
  notEvaluated?: number;
  highestScore?: number;
}

export interface AdminResultsResponse {
  success: boolean;
  mode: string;
  notice: string;
  stats: {
    total_projects: number;
    evaluated_projects: number;
    not_evaluated_projects: number;
    total_evaluations: number;
    highest_raw_score: number;
    highest_merit_score: number;
  };
  themes: ThemeSummaryItem[];
  awards: AwardWinnerItem[];
  projects: Array<{
    registration_id: string;
    team_name: string;
    project_title: string;
    category: string;
    institution_name: string;
    leader_name: string;
    problem_statement?: string;
    proposed_solution?: string;
    innovation?: string;
    members: ParticipantMember[];
    evaluations_count: number;
    raw_average: number;
    criteria_averages: Record<string, number>;
    theme_min?: number | null;
    theme_max?: number | null;
    normalized_score?: number | null;
    merit_score?: number | null;
    overall_rank?: number | null;
    theme_rank?: number | null;
    award?: string | null;
    award_type?: string | null;
    status: string;
    is_eligible: boolean;
    tie_status: string;
    evaluations: Array<{
      id: string;
      judge_id: string;
      judge_name: string;
      judge_email: string;
      total_score: number;
      scores: Record<string, number>;
      comments?: string;
      submitted_at: string;
    }>;
  }>;
  calculated_at: string;
}

// ─── Jury Management & Dynamic Allocation Types ───────────────────────────────

export interface JuryProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  department: string;
  is_active: boolean;
  evaluations_completed: number;
  assigned_domains_count: number;
  created_at?: string;
}

export interface DomainAssignmentItem {
  id: string;
  judge_user_id: string;
  domain_id: string;
  domain_title: string;
  assignment_mode: 'ALL' | 'SELECTED';
  is_active: boolean;
  selected_projects_count: number;
  created_at: string;
}

export interface ProjectAssignmentItem {
  id: string;
  jury_domain_assignment_id: string;
  registration_id: string;
  project_title: string;
  team_name: string;
  created_at: string;
}

export interface ProjectCompletionItem {
  registration_id: string;
  team_name: string;
  project_title: string;
  category: string;
  domain_id?: string;
  domain_title?: string;
  assigned_juries: Array<{
    user_id: string;
    name: string;
    email: string;
  }>;
  submitted_juries: Array<{
    judge_id: string;
    judge_name: string;
    judge_email: string;
    total_score: number;
  }>;
  assigned_count: number;
  submitted_count: number;
  status: 'UNASSIGNED' | 'NOT_EVALUATED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface JuryCompletionOverviewResponse {
  success: boolean;
  total_projects: number;
  completed_projects: number;
  in_progress_projects: number;
  not_evaluated_projects: number;
  unassigned_projects: number;
  projects: ProjectCompletionItem[];
}

export interface AssignedProjectItem {
  registration_id: string;
  team_name: string;
  project_title: string;
  category: string;
  institution_name: string;
  leader_name: string;
  members: Array<{ name: string; email: string; role: string }>;
  problem_statement?: string;
  proposed_solution?: string;
  innovation?: string;
  expected_outcomes?: string;
  is_evaluated: boolean;
  evaluation_id?: string;
  assignment_mode: 'ALL' | 'SELECTED';
  domain_id?: string | null;
  domain_title?: string | null;
  evaluation_status?: 'EVALUATED' | 'PENDING';
  total_score?: number | null;
  submitted_at?: string | null;
}

export interface AssignedProjectsResponse {
  success: boolean;
  judge_user_id: string;
  total_assigned: number;
  completed_count: number;
  pending_count: number;
  projects: AssignedProjectItem[];
}

export interface JuryBootstrapSummary {
  assigned: number;
  evaluated: number;
  remaining: number;
}

export interface JuryBootstrapResponse {
  success: boolean;
  jury: {
    user_id: string;
    name: string;
    email: string;
    department: string;
    is_active: boolean;
  };
  assignments: DomainAssignmentItem[];
  projects: AssignedProjectItem[];
  summary: JuryBootstrapSummary;
  evaluations: Evaluation[];
}

export interface JuryProjectProgressItem {
  registration_id: string;
  project_title: string;
  team_name: string;
  domain_id?: string;
  domain_title?: string;
  assignment_mode: 'ALL' | 'SELECTED';
  evaluation_status: 'EVALUATED' | 'PENDING';
  total_score: number | null;
  submitted_at?: string | null;
}

export interface JuryProjectProgressResponse {
  success: boolean;
  jury_user_id: string;
  assigned_projects: number;
  evaluated_projects: number;
  remaining_projects: number;
  projects: JuryProjectProgressItem[];
}

export interface AssignmentCandidateItem {
  registration_id: string;
  project_title: string;
  team_name?: string;
  institution?: string;
  canonical_domain_id: string;
  domain_title?: string;
  canonical_domain_title?: string;
  is_assigned: boolean;
  assigned_to_judge_id?: string | null;
  assigned_to_judge_name?: string | null;
  assigned_jury_name?: string | null;
  assigned_jury_id?: string | null;
  available?: boolean;
}

export interface AssignmentCandidatesResponse {
  success: boolean;
  domain_id: string;
  domain_title: string;
  total_candidates?: number;
  available_candidates?: number;
  assigned_candidates?: number;
  available_count?: number;
  already_assigned_count?: number;
  candidates: AssignmentCandidateItem[];
}

export interface MarksExportItem {
  registration_id: string;
  project_title: string;
  team_name?: string | null;
  institution_name?: string | null;
  canonical_theme: string;
  assigned_jury_name?: string | null;
  evaluation_status: 'Evaluated' | 'Pending';
  innovation_score?: number | null;
  technical_score?: number | null;
  working_model_score?: number | null;
  applicability_score?: number | null;
  presentation_score?: number | null;
  raw_total?: number | null;
  evaluated_at?: string | null;
}

export interface MarksExportResponse {
  success: boolean;
  total_projects: number;
  evaluated_count: number;
  pending_count: number;
  projects: MarksExportItem[];
}
