/**
 * resultsService.ts - Results & Evaluation Aggregation Service
 *
 * Frontend service boundary for calculating multi-judge project scores and statistics.
 */

import { ProjectResult, ResultsStats, JudgeScoreBreakdown, ParticipantMember } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export class ResultsService {
  /**
   * Get aggregated results for all projects
   */
  public static async getProjectResults(): Promise<ProjectResult[]> {
    let rawRegistrations: any[] = [];
    let rawEvaluations: any[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const [regRes, evalRes] = await Promise.all([
          supabase
            .from('registrations')
            .select('*, team_members(*), projects(*), institutions(*)')
            .order('created_at', { ascending: false }),
          supabase
            .from('judge_evaluations')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

        if (!regRes.error && regRes.data) {
          rawRegistrations = regRes.data;
        }
        if (!evalRes.error && evalRes.data) {
          rawEvaluations = evalRes.data;
        }
      } catch (err) {
        console.warn('[resultsService] Error querying results:', err);
      }
    }

    if (rawRegistrations.length === 0) {
      return [];
    }

    // Group evaluations by registration_id
    const evalMap = new Map<string, JudgeScoreBreakdown[]>();
    rawEvaluations.forEach((row: any) => {
      const regId = (row.registration_id || '').toUpperCase();
      if (!regId) return;

      const breakdown: JudgeScoreBreakdown = {
        judgeId: row.judge_id ? String(row.judge_id) : `judge-${row.judge_email}`,
        judgeName: row.judge_name || row.judge_email.split('@')[0],
        judgeEmail: row.judge_email,
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

      const list = evalMap.get(regId) || [];
      list.push(breakdown);
      evalMap.set(regId, list);
    });

    // Map each registration into a ProjectResult
    return rawRegistrations.map((reg: any) => {
      const regId = (reg.registration_id || '').toUpperCase();
      const proj = Array.isArray(reg.projects) ? reg.projects[0] : reg.projects;
      const inst = Array.isArray(reg.institutions) ? reg.institutions[0] : reg.institutions;
      const members: ParticipantMember[] = (reg.team_members || []).map((m: any) => ({
        name: m.name || '',
        email: m.email || '',
        phone: m.mobile || '',
        role: m.is_team_leader ? 'Leader' : 'Member',
        rollNumber: m.roll_number,
        department: m.department,
      }));

      const leaderMember = members.find((m) => m.role === 'Leader') || members[0];
      const evals = evalMap.get(regId) || [];
      const completedJudges = evals.length;

      // Dynamic average: sum of total scores / count
      const totalScoreSum = evals.reduce((sum, e) => sum + (e.totalScore || 0), 0);
      const averageScore = completedJudges > 0 ? Number((totalScoreSum / completedJudges).toFixed(2)) : 0;

      let status: 'Complete' | 'In Progress' | 'Not Evaluated' = 'Not Evaluated';
      if (completedJudges >= 3) {
        status = 'Complete';
      } else if (completedJudges > 0) {
        status = 'In Progress';
      }

      return {
        registrationId: regId,
        teamName: reg.team_name || 'Team',
        projectTitle: proj?.title || 'Project Title',
        category: proj?.category || 'General',
        institutionName: inst?.name || reg.institution_name || 'SR University',
        leaderName: reg.leader_name || leaderMember?.name || 'Leader',
        members,
        problemStatement: proj?.problem_statement || '',
        proposedSolution: proj?.proposed_solution || '',
        innovation: proj?.innovation || '',
        expectedJudges: 3,
        completedJudges,
        averageScore,
        status,
        evaluations: evals,
      };
    });
  }

  /**
   * Calculate summary statistics for the results dashboard
   */
  public static getResultStats(results: ProjectResult[]): ResultsStats {
    const totalProjects = results.length;
    const fullyEvaluated = results.filter((p) => p.status === 'Complete').length;
    const inProgress = results.filter((p) => p.status === 'In Progress').length;
    const notEvaluated = results.filter((p) => p.status === 'Not Evaluated').length;
    const highestScore = results.reduce((max, p) => (p.averageScore > max ? p.averageScore : max), 0);

    return {
      totalProjects,
      fullyEvaluated,
      inProgress,
      notEvaluated,
      highestScore,
    };
  }
}
