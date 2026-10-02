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
