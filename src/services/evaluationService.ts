/**
 * evaluationService.ts - Evaluation Criteria & Scorecard Submission Service
 *
 * Frontend service boundary for managing evaluation criteria and judge scorecards.
 */

import { Evaluation, EvaluationCriterion, SubmitEvaluationPayload } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    id: 'crit-1',
    key: 'innovation',
    label: 'Innovation & Novelty',
    description: 'Originality of concept, uniqueness of approach, creativity',
    maxScore: 20,
    displayOrder: 1,
  },
  {
    id: 'crit-2',
    key: 'technical',
    label: 'Technical Execution',
    description: 'Architecture, engineering depth, prototype functionality, code quality',
    maxScore: 20,
    displayOrder: 2,
  },
  {
    id: 'crit-3',
    key: 'relevance',
    label: 'Problem Relevance',
    description: 'Significance and relevance of the problem addressed',
    maxScore: 20,
    displayOrder: 3,
  },
  {
    id: 'crit-4',
    key: 'presentation',
    label: 'Presentation & Demonstration',
    description: 'Clarity of explanation, pitch delivery, live prototype demo, Q&A defense',
    maxScore: 20,
    displayOrder: 4,
  },
  {
    id: 'crit-5',
    key: 'impact',
    label: 'Impact & Feasibility',
    description: 'Real-world utility, scalability, market potential, societal impact',
    maxScore: 20,
    displayOrder: 5,
  },
];

export class EvaluationService {
  /**
   * Fetch active evaluation criteria
   */
  public static async getCriteria(): Promise<EvaluationCriterion[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('evaluation_criteria')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: String(d.id),
            key: d.key,
            label: d.label,
            description: d.description || '',
            maxScore: d.max_score || 20,
            displayOrder: d.display_order || 0,
          }));
        }
      } catch (err) {
        console.warn('[evaluationService] Criteria DB load notice:', err);
      }
    }

    return DEFAULT_EVALUATION_CRITERIA;
  }

  /**
   * Get all evaluations submitted by a specific judge
   */
  public static async getEvaluationsByJudge(judgeEmail: string): Promise<Evaluation[]> {
    const cleanEmail = judgeEmail.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('judge_evaluations')
          .select('*')
          .ilike('judge_email', cleanEmail)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(this.mapDbRowToEvaluation);
        }
      } catch (err) {
        console.warn('[evaluationService] getEvaluationsByJudge notice:', err);
      }
    }

    return [];
  }

  /**
   * Check if a specific judge has already evaluated a project
   */
  public static async getEvaluationForJudgeAndProject(
    judgeEmail: string,
    registrationId: string
  ): Promise<Evaluation | null> {
    const cleanEmail = judgeEmail.trim().toLowerCase();
    const cleanRegId = registrationId.trim().toUpperCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('judge_evaluations')
          .select('*')
          .ilike('judge_email', cleanEmail)
          .eq('registration_id', cleanRegId)
          .limit(1);

        if (!error && data && data.length > 0) {
          return this.mapDbRowToEvaluation(data[0]);
        }
      } catch (err) {
        console.warn('[evaluationService] Single eval lookup notice:', err);
      }
    }

    return null;
  }

  /**
   * Submit an evaluation for a project by a judge
   */
  public static async submitEvaluation(
    payload: SubmitEvaluationPayload
  ): Promise<{ success: boolean; evaluation?: Evaluation; error?: string }> {
    const cleanEmail = payload.judgeEmail.trim().toLowerCase();
    const cleanRegId = payload.registrationId.trim().toUpperCase();

    // Check duplicate
    const existing = await this.getEvaluationForJudgeAndProject(cleanEmail, cleanRegId);
    if (existing) {
      return {
        success: false,
        error: 'You have already evaluated this project. Duplicate evaluations are not permitted.',
      };
    }

    // Compute total score
    const scores = payload.scores || {};
    const inno = Math.min(20, Math.max(0, Number(scores.innovation) || 0));
    const tech = Math.min(20, Math.max(0, Number(scores.technical) || 0));
    const relev = Math.min(20, Math.max(0, Number(scores.relevance) || 0));
    const pres = Math.min(20, Math.max(0, Number(scores.presentation) || 0));
    const imp = Math.min(20, Math.max(0, Number(scores.impact) || 0));
    const total = inno + tech + relev + pres + imp;

    const rowData = {
      judge_email: cleanEmail,
      judge_name: payload.judgeName.trim(),
      registration_id: cleanRegId,
      team_name: payload.teamName.trim(),
      project_title: payload.projectTitle.trim(),
      category: payload.category.trim(),
      innovation_score: inno,
      technical_score: tech,
      relevance_score: relev,
      presentation_score: pres,
      impact_score: imp,
      criteria_scores: {
        innovation: inno,
        technical: tech,
        relevance: relev,
        presentation: pres,
        impact: imp,
      },
      total_score: total,
      comments: (payload.comments || '').trim(),
      status: 'submitted',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('judge_evaluations')
          .insert([rowData])
          .select()
          .single();

        if (error) throw error;
        return { success: true, evaluation: this.mapDbRowToEvaluation(data) };
      } catch (err: any) {
        console.error('[evaluationService] Database insert error:', err);
        return { success: false, error: err.message || 'Database error during submission.' };
      }
    }

    // Fallback evaluation object
    const fallbackEval: Evaluation = {
      id: `eval-${Date.now()}`,
      registrationId: cleanRegId,
      projectTitle: payload.projectTitle,
      teamName: payload.teamName,
      category: payload.category,
      judgeId: `judge-${cleanEmail}`,
      judgeEmail: cleanEmail,
      judgeName: payload.judgeName,
      scores: {
        innovation: inno,
        technical: tech,
        relevance: relev,
        presentation: pres,
        impact: imp,
      },
      totalScore: total,
      comments: payload.comments,
      submittedAt: new Date().toISOString(),
    };

    return { success: true, evaluation: fallbackEval };
  }

  /**
   * Helper to map DB row into typed Evaluation
   */
  private static mapDbRowToEvaluation(row: any): Evaluation {
    return {
      id: String(row.id),
      registrationId: (row.registration_id || '').toUpperCase(),
      projectTitle: row.project_title || '',
      teamName: row.team_name || '',
      category: row.category || '',
      judgeId: row.judge_id ? String(row.judge_id) : `judge-${row.judge_email}`,
      judgeEmail: row.judge_email,
      judgeName: row.judge_name || row.judge_email.split('@')[0],
      scores: row.criteria_scores || {
        innovation: Number(row.innovation_score) || 0,
        technical: Number(row.technical_score) || 0,
        relevance: Number(row.relevance_score) || 0,
        presentation: Number(row.presentation_score) || 0,
        impact: Number(row.impact_score) || 0,
      },
      totalScore: Number(row.total_score) || 0,
      comments: row.comments || '',
      submittedAt: row.created_at || new Date().toISOString(),
    };
  }
}
