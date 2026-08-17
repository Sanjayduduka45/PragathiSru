/**
 * PRAGATHI 2K26 - Standardized Frontend Types
 * Single source of truth for all domain interfaces.
 */

// ─── ROLES & USERS ─────────────────────────────────────────────────────────────

export type AppRole = 'admin' | 'judge' | 'participant';

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
  name: string;
  email: string;
  department: string;
  isActive: boolean;
  evaluationsCompleted: number;
  lastEvaluationAt?: string | null;
  createdAt?: string;
}

export interface CreateJudgeInput {
  name: string;
  email: string;
  department?: string;
  temporaryPassword?: string;
  isActive?: boolean;
}

export interface JudgeStats {
  totalJudges: number;
  activeJudges: number;
  totalEvaluations: number;
  pendingEvaluations: number;
}

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
  judgeEmail: string;
  judgeName: string;
  scores: Record<string, number>;
  comments?: string;
}

// ─── RESULTS & AGGREGATIONS ───────────────────────────────────────────────────

export interface JudgeScoreBreakdown {
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
  expectedJudges: number;
  completedJudges: number;
  averageScore: number;
  status: 'Complete' | 'In Progress' | 'Not Evaluated';
  evaluations: JudgeScoreBreakdown[];
}

export interface ResultsStats {
  totalProjects: number;
  fullyEvaluated: number;
  inProgress: number;
  notEvaluated: number;
  highestScore: number;
}
