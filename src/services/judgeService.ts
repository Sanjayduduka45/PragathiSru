/**
 * judgeService.ts - Judge Management Service
 *
 * Frontend service boundary for creating and managing judge accounts.
 * Connects to Supabase / backend API when available.
 */

import { Judge, JudgeStats, CreateJudgeInput } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export class JudgeService {
  /**
   * Fetch all judges with real-time evaluation counts
   */
  public static async getJudges(): Promise<Judge[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('role', 'judge')
          .order('created_at', { ascending: false });

        if (roleError) {
          console.warn('[judgeService] Error fetching user_roles:', roleError);
        } else if (roleData && roleData.length > 0) {
          // Fetch evaluation count grouped by judge_email
          const { data: evalData } = await supabase
            .from('judge_evaluations')
            .select('judge_email, created_at');

          const evalMap = new Map<string, { count: number; lastAt: string | null }>();
          if (evalData) {
            evalData.forEach((ev: { judge_email: string; created_at: string }) => {
              const emailKey = (ev.judge_email || '').toLowerCase();
              const existing = evalMap.get(emailKey) || { count: 0, lastAt: null };
              existing.count += 1;
              if (!existing.lastAt || new Date(ev.created_at) > new Date(existing.lastAt)) {
                existing.lastAt = ev.created_at;
              }
              evalMap.set(emailKey, existing);
            });
          }

          return roleData.map((r: any) => {
            const stats = evalMap.get((r.user_email || '').toLowerCase()) || { count: 0, lastAt: null };
            return {
              id: String(r.id),
              name: r.display_name || r.user_email.split('@')[0],
              email: r.user_email,
              department: r.department || '',
              isActive: r.is_active ?? true,
              evaluationsCompleted: stats.count,
              lastEvaluationAt: stats.lastAt,
              createdAt: r.created_at,
            };
          });
        }
      } catch (err) {
        console.warn('[judgeService] DB fetch failed:', err);
      }
    }

    // Default realistic empty state when no database records exist
    return [];
  }

  /**
   * Create a new judge:
   * Inserts into user_roles with role = 'judge'.
   * TODO: When backend auth is connected, backend endpoint will provision secure credentials.
   */
  public static async createJudge(
    input: CreateJudgeInput,
    assignedBy: string = 'admin'
  ): Promise<{ success: boolean; judge?: Judge; error?: string }> {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanName = input.name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (!cleanName) {
      return { success: false, error: 'Judge name is required.' };
    }
    if (input.temporaryPassword && input.temporaryPassword.trim().length < 6) {
      return { success: false, error: 'Temporary password must be at least 6 characters.' };
    }

    const payload = {
      user_email: cleanEmail,
      role: 'judge',
      display_name: cleanName,
      department: input.department?.trim() || '',
      is_active: input.isActive ?? true,
      assigned_by: assignedBy,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .upsert(payload, { onConflict: 'user_email' })
          .select()
          .single();

        if (error) throw error;

        const newJudge: Judge = {
          id: String(data.id),
          name: data.display_name,
          email: data.user_email,
          department: data.department || '',
          isActive: data.is_active,
          evaluationsCompleted: 0,
          createdAt: data.created_at,
        };

        return { success: true, judge: newJudge };
      } catch (err: any) {
        console.error('[judgeService] Failed to create judge in Supabase:', err);
        return { success: false, error: err.message || 'Database error creating judge.' };
      }
    }

    // Frontend fallback object when DB is unconfigured
    const newJudge: Judge = {
      id: `judge-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      department: input.department?.trim() || '',
      isActive: input.isActive ?? true,
      evaluationsCompleted: 0,
      createdAt: new Date().toISOString(),
    };

    return { success: true, judge: newJudge };
  }

  /**
   * Toggle judge active/inactive status
   */
  public static async updateJudgeStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('user_roles')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  }

  /**
   * Delete a judge account
   */
  public static async deleteJudge(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('user_roles').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  }

  /**
   * Calculate judge statistics
   */
  public static async getJudgeStats(): Promise<JudgeStats> {
    const judges = await this.getJudges();
    const totalJudges = judges.length;
    const activeJudges = judges.filter((j) => j.isActive).length;
    const totalEvaluations = judges.reduce((acc, j) => acc + (j.evaluationsCompleted || 0), 0);

    let totalProjects = 0;
    if (isSupabaseConfigured && supabase) {
      try {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true });
        totalProjects = count || 0;
      } catch {
        totalProjects = 0;
      }
    }

    const targetEvaluations = totalProjects > 0 ? totalProjects * 3 : 0;
    const pendingEvaluations = Math.max(0, targetEvaluations - totalEvaluations);

    return {
      totalJudges,
      activeJudges,
      totalEvaluations,
      pendingEvaluations,
    };
  }
}
