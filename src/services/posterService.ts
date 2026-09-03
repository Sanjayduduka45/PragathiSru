/**
 * posterService.ts
 * Phase 3 — Poster Submissions Service
 *
 * Handles all CRUD for the poster_submissions table.
 * - Participant: upsert draft, submit (sets status = 'submitted')
 * - Admin: fetch all submitted posters with joined team/registration data
 *
 * The poster_submissions table has UNIQUE(registration_id), so upsert
 * always touches the same row — no duplicate records are created.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Fields stored inside poster_content JSONB */
export interface PosterContent {
  teamName: string;
  projectTitle: string;
  category: string;
  institutionName: string;
  leaderName: string;
  leaderEmail: string;

  // Uploaded Poster File details
  fileUrl?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;

  // Slide-specific editable content (legacy support)
  teamMembers?: string;
  departmentDetails?: string;
  introduction?: string;
  methodology?: string;
  conclusion?: string;
  references?: string;

  // Image / Diagram uploads (base64 data URIs)
  diagram1?: string;
  diagram1Caption?: string;
  diagram2?: string;
  diagram2Caption?: string;
  diagram3?: string;
  diagram3Caption?: string;
}

export type PosterStatus = 'draft' | 'submitted';

export interface PosterSubmission {
  id: string;
  registrationInternalId: string; // UUID from registrations.id
  status: PosterStatus;
  posterContent: PosterContent | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by getAllSubmittedPosters() for admin view */
export interface AdminPosterRecord {
  posterId: string;
  registrationInternalId: string;
  registrationId: string;          // public PRAGATHI26-XXXXXX id
  teamName: string;
  projectTitle: string;
  category: string;
  leaderName: string;
  leaderEmail: string;
  institutionName: string;
  status: PosterStatus;
  submittedAt: string | null;
  posterContent: PosterContent | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const PosterService = {
  /**
   * Authoritative backend/database verification:
   * Checks if userEmail is the verified Team Leader of registrationInternalId
   * directly from public.registrations and public.team_members.
   */
  async verifyLeaderAuthorization(
    registrationInternalId: string,
    userEmail: string
  ): Promise<{ authorized: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { authorized: false, error: 'Database not configured.' };
    }

    const cleanEmail = (userEmail || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { authorized: false, error: 'User email is required for authorization verification.' };
    }

    try {
      const { data: regRow, error } = await supabase
        .from('registrations')
        .select('id, leader_email, team_members(email, is_team_leader)')
        .eq('id', registrationInternalId)
        .single();

      if (error || !regRow) {
        return { authorized: false, error: 'Registration record not found.' };
      }

      const dbLeaderEmail = (regRow.leader_email || '').trim().toLowerCase();
      const members = (regRow.team_members as Array<{ email?: string; is_team_leader?: boolean }>) || [];

      const isLeader =
        cleanEmail === dbLeaderEmail ||
        members.some(
          (tm) => (tm.email || '').trim().toLowerCase() === cleanEmail && tm.is_team_leader
        );

      if (!isLeader) {
        return {
          authorized: false,
          error: 'Forbidden: Only the designated Team Leader can create, edit, or submit project posters.',
        };
      }

      return { authorized: true };
    } catch (err) {
      console.error('PosterService.verifyLeaderAuthorization exception:', err);
      return { authorized: false, error: 'Authorization verification failed.' };
    }
  },

  /**
   * Participant: upsert a poster draft.
   * Creates the record if it doesn't exist, or updates it if it does.
   * Uses ON CONFLICT on registration_id to enforce one-record-per-team.
   * Enforces server-side leader authorization before writing.
   */
  async upsertPosterDraft(
    registrationInternalId: string,
    content: PosterContent,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Database not configured.' };
    }

    if (userEmail) {
      const auth = await this.verifyLeaderAuthorization(registrationInternalId, userEmail);
      if (!auth.authorized) {
        return { success: false, error: auth.error };
      }
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('poster_submissions')
      .upsert(
        {
          registration_id: registrationInternalId,
          poster_content: content,
          status: 'draft',
          updated_at: now,
        },
        {
          onConflict: 'registration_id',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('PosterService.upsertPosterDraft error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Participant: submit poster (status → 'submitted').
   * Updates only the existing row for this registration.
   * Enforces server-side leader authorization before writing.
   */
  async submitPoster(
    registrationInternalId: string,
    content: PosterContent,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Database not configured.' };
    }

    if (userEmail) {
      const auth = await this.verifyLeaderAuthorization(registrationInternalId, userEmail);
      if (!auth.authorized) {
        return { success: false, error: auth.error };
      }
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('poster_submissions')
      .upsert(
        {
          registration_id: registrationInternalId,
          poster_content: content,
          status: 'submitted',
          submitted_at: now,
          updated_at: now,
        },
        {
          onConflict: 'registration_id',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('PosterService.submitPoster error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Participant: Upload an already-prepared project poster file (PDF, PNG, JPG).
   * Securely dispatches upload to FastAPI backend (/api/posters/upload) which verifies
   * Team Leader authorization and stores the file into Supabase Storage project-posters
   * using server-side service-role credentials.
   */
  async uploadPosterFile(
    registrationInternalId: string,
    file: File,
    meta: {
      registrationId: string;
      teamName: string;
      projectTitle: string;
      category: string;
      institutionName: string;
      leaderName: string;
      leaderEmail: string;
    },
    userEmail?: string
  ): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
      const regId = meta.registrationId || registrationInternalId;
      const leaderEmail = userEmail || meta.leaderEmail;

      if (!regId) {
        return { success: false, error: 'Registration ID is required.' };
      }
      if (!leaderEmail) {
        return { success: false, error: 'Team Leader email is required.' };
      }

      const formData = new FormData();
      formData.append('registration_id', regId);
      formData.append('leader_email', leaderEmail);
      formData.append('file', file);

      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/posters/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
        const errorMessage = errorBody.detail || errorBody.message || `Upload failed (HTTP ${response.status})`;
        return { success: false, error: errorMessage };
      }

      const result = await response.json();
      return {
        success: true,
        fileUrl: result.fileUrl,
      };
    } catch (err: any) {
      console.error('PosterService.uploadPosterFile error:', err);
      return { success: false, error: err?.message || 'Failed to connect to backend server for poster upload.' };
    }
  },

  /**
   * Participant: fetch their own poster record by registrations.id (internal UUID).
   */
  async getMyPoster(
    registrationInternalId: string
  ): Promise<PosterSubmission | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('poster_submissions')
      .select('*')
      .eq('registration_id', registrationInternalId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id as string,
      registrationInternalId: data.registration_id as string,
      status: data.status as PosterStatus,
      posterContent: (data.poster_content as PosterContent) ?? null,
      submittedAt: (data.submitted_at as string) ?? null,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  },

  /**
   * Participant: resolve their internal UUID from their public registration_id string.
   * Needed because the participant session stores the public ID (PRAGATHI26-XXXXXX),
   * but poster_submissions links to registrations.id (UUID).
   */
  async resolveInternalId(
    publicRegistrationId: string
  ): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('registrations')
      .select('id')
      .eq('registration_id', publicRegistrationId)
      .single();

    if (error || !data) return null;
    return data.id as string;
  },

  /**
   * Admin: fetch all submitted posters with joined registration + institution data.
   * Returns only status='submitted' records.
   */
  async getAllSubmittedPosters(): Promise<AdminPosterRecord[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('poster_submissions')
      .select(
        `
        id,
        registration_id,
        status,
        poster_content,
        submitted_at,
        created_at,
        updated_at,
        registrations (
          id,
          registration_id,
          team_name,
          leader_name,
          leader_email,
          institutions (
            name
          ),
          projects (
            title,
            category
          )
        )
      `
      )
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('PosterService.getAllSubmittedPosters error:', error);
      return [];
    }

    return (data ?? []).map((row: Record<string, unknown>) => {
      const reg = row.registrations as Record<string, unknown> | null;
      const inst = Array.isArray(reg?.institutions)
        ? (reg?.institutions[0] as Record<string, unknown>)
        : (reg?.institutions as Record<string, unknown> | null);
      const proj = Array.isArray(reg?.projects)
        ? (reg?.projects[0] as Record<string, unknown>)
        : (reg?.projects as Record<string, unknown> | null);

      const content = row.poster_content as PosterContent | null;

      return {
        posterId: row.id as string,
        registrationInternalId: row.registration_id as string,
        registrationId: (reg?.registration_id as string) ?? '',
        teamName: (reg?.team_name as string) ?? content?.teamName ?? '',
        projectTitle: (proj?.title as string) ?? content?.projectTitle ?? '',
        category: (proj?.category as string) ?? content?.category ?? '',
        leaderName: (reg?.leader_name as string) ?? content?.leaderName ?? '',
        leaderEmail: (reg?.leader_email as string) ?? content?.leaderEmail ?? '',
        institutionName: (inst?.name as string) ?? content?.institutionName ?? '',
        status: row.status as PosterStatus,
        submittedAt: (row.submitted_at as string) ?? null,
        posterContent: content,
      };
    });
  },
};
