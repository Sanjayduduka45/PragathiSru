/**
 * juryService.ts - PRAGATHI 2K26 Dynamic Jury Management Client Service
 *
 * Provides typed access to:
 * - Admin Jury account management (via create-judge edge function and FastAPI)
 * - Domain & Project assignment CRUD
 * - Live Completion overview
 * - Authoritative Jury assigned-projects queries
 */

import { api } from './api';
import { supabase } from '../lib/supabaseClient';
import {
  JuryProfile,
  DomainAssignmentItem,
  ProjectAssignmentItem,
  JuryCompletionOverviewResponse,
  AssignedProjectsResponse,
  AssignedProjectItem,
  JuryProjectProgressResponse,
  JuryBootstrapResponse,
} from '../types';

export interface CreateJuryPayload {
  name: string;
  email: string;
  department: string;
  temporaryPassword?: string;
  isActive?: boolean;
}

export class JuryService {
  /**
   * List all juries with stats (Admin)
   */
  public static async listJuries(): Promise<JuryProfile[]> {
    return api.juries.list();
  }

  /**
   * Create a new jury account via the existing Supabase Edge Function `create-judge`
   */
  public static async createJury(payload: CreateJuryPayload): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    const { data, error } = await supabase.functions.invoke('create-judge', {
      body: payload,
    });
    if (error) {
      throw new Error(error.message || 'Failed to create judge account');
    }
    return data;
  }

  /**
   * Update jury profile or active status (Admin)
   */
  public static async updateJuryProfile(
    judgeUserId: string,
    data: { name?: string; department?: string; is_active?: boolean }
  ): Promise<{ success: boolean; message: string }> {
    return api.juries.updateProfile(judgeUserId, data);
  }

  /**
   * Get domain assignments for a jury (Admin)
   */
  public static async getJuryAssignments(judgeUserId: string): Promise<DomainAssignmentItem[]> {
    return api.juries.getAssignments(judgeUserId);
  }

  /**
   * Assign a domain to a jury (Admin)
   */
  public static async assignDomain(
    judgeUserId: string,
    data: { domain_id: string; assignment_mode: 'ALL' | 'SELECTED' }
  ): Promise<{ success: boolean; assignment: any }> {
    return api.juries.assignDomain(judgeUserId, data);
  }

  /**
   * Switch assignment mode ALL <-> SELECTED (Admin)
   */
  public static async updateAssignmentMode(
    assignmentId: string,
    assignmentMode: 'ALL' | 'SELECTED'
  ): Promise<{ success: boolean; message: string }> {
    return api.juries.updateAssignmentMode(assignmentId, assignmentMode);
  }

  /**
   * Remove a domain assignment (Admin)
   */
  public static async removeAssignment(
    assignmentId: string
  ): Promise<{ success: boolean; message: string }> {
    return api.juries.removeAssignment(assignmentId);
  }

  /**
   * Get explicit project assignments for a SELECTED domain assignment (Admin)
   */
  public static async getSelectedProjects(
    assignmentId: string
  ): Promise<ProjectAssignmentItem[]> {
    return api.juries.getSelectedProjects(assignmentId);
  }

  /**
   * Add selected projects to a domain assignment (Admin)
   */
  public static async addSelectedProjects(
    assignmentId: string,
    registrationIds: string[]
  ): Promise<{ success: boolean; added_count: number }> {
    return api.juries.addSelectedProjects(assignmentId, registrationIds);
  }

  /**
   * Remove a project assignment from a SELECTED domain (Admin)
   */
  public static async removeSelectedProject(
    projectAssignmentId: string
  ): Promise<{ success: boolean; message: string }> {
    return api.juries.removeSelectedProject(projectAssignmentId);
  }

  /**
   * Dynamic Completion Overview for all projects (Admin)
   */
  /**
   * Complete assigned project list and evaluation progress for a jury (Admin)
   */
  public static async getProjectProgress(judgeUserId: string): Promise<JuryProjectProgressResponse> {
    return api.juries.getProjectProgress(judgeUserId);
  }

  public static async getCompletionOverview(): Promise<JuryCompletionOverviewResponse> {
    return api.juries.getCompletionOverview();
  }

  /**
   * Authoritative Assigned Projects for current authenticated Jury member (Jury)
   */
  public static async getAssignedProjects(): Promise<AssignedProjectsResponse> {
    return api.juries.getAssignedProjects();
  }

  /**
   * Authoritative Single Assigned Project verification (Jury)
   */
  public static async getAssignedProjectById(
    registrationId: string
  ): Promise<AssignedProjectItem> {
    return api.juries.getAssignedProjectById(registrationId);
  }

  // ─── Fast In-Memory Session Cache & In-Flight Request Deduplication ───────
  private static _cachedBootstrap: JuryBootstrapResponse | null = null;
  private static _cachedBootstrapUserId: string | null = null;
  private static _inFlightBootstrap: Promise<JuryBootstrapResponse> | null = null;
  private static _inFlightUserId: string | null = null;

  /**
   * Get cached bootstrap data from memory if present and belongs to current user.
   * Visual acceleration only; backend remains authoritative.
   */
  public static getCachedBootstrap(userId?: string): JuryBootstrapResponse | null {
    if (userId && this._cachedBootstrapUserId && this._cachedBootstrapUserId !== userId) {
      return null;
    }
    return this._cachedBootstrap;
  }

  /**
   * Authoritative Bootstrap: fetches jury profile, assignments, projects,
   * summary counts, and evaluations in a single fast call.
   * Protects against request stampedes by reusing any currently in-flight Promise.
   */
  public static async bootstrap(userId?: string): Promise<JuryBootstrapResponse> {
    // If an identical bootstrap request is already in-flight for this user/session, reuse it
    if (this._inFlightBootstrap) {
      if (!userId || !this._inFlightUserId || this._inFlightUserId === userId) {
        return this._inFlightBootstrap;
      }
    }

    this._inFlightUserId = userId || null;
    this._inFlightBootstrap = (async () => {
      try {
        const data = await api.juries.bootstrap();
        if (data && data.success) {
          this._cachedBootstrap = data;
          this._cachedBootstrapUserId = userId || data.jury?.user_id || null;
        }
        return data;
      } finally {
        this._inFlightBootstrap = null;
        this._inFlightUserId = null;
      }
    })();

    return this._inFlightBootstrap;
  }

  /**
   * Clears the in-memory bootstrap cache and in-flight promise (e.g. on logout)
   */
  public static clearBootstrapCache(): void {
    this._cachedBootstrap = null;
    this._cachedBootstrapUserId = null;
    this._inFlightBootstrap = null;
    this._inFlightUserId = null;
  }
}
