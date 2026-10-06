/**
 * Centralized API client for PRAGATHI 2K26 Expo Application.
 * All frontend requests (Public & Admin Dashboard) call the FastAPI Python backend.
 */

import { supabase } from '../lib/supabaseClient';
import {
  AdminResultsResponse,
  JuryProfile,
  DomainAssignmentItem,
  ProjectAssignmentItem,
  JuryCompletionOverviewResponse,
  AssignedProjectsResponse,
  AssignedProjectItem,
  JuryProjectProgressResponse,
  JuryBootstrapResponse,
  AssignmentCandidatesResponse,
  MarksExportResponse,
  ResetJuryPasswordResponse,
} from '../types';

import { sessionManager } from './sessionManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

export function setApiAuthToken(token: string | null, expiresInSeconds: number = 3600) {
  if (token) {
    sessionManager.applySession({
      access_token: token,
      expires_in: expiresInSeconds,
    } as any);
  } else {
    sessionManager.clearSession('UNAUTHENTICATED');
  }
}

async function request<T>(endpoint: string, options?: RequestInit, isRetry = false): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const isProtected = endpoint.startsWith('/api/admin/') || endpoint.startsWith('/api/jury');
  const isFormData = options?.body instanceof FormData;
  const method = (options?.method || 'GET').toUpperCase();
  const isSafeGet = method === 'GET';
  const maxAttempts = isSafeGet ? 3 : 1;

  let authToken: string | null = null;
  if (isProtected) {
    authToken = await sessionManager.getValidToken();
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const startTime = Date.now();
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          ...options?.headers,
        },
        ...options,
      });
    } catch (networkErr: any) {
      const duration = Date.now() - startTime;
      const isNetworkFailure =
        networkErr.name === 'TypeError' ||
        networkErr.message?.includes('fetch') ||
        networkErr.message?.includes('network') ||
        networkErr.message?.includes('Load failed');

      if (isSafeGet && isNetworkFailure && attempt < maxAttempts) {
        const backoffMs = attempt === 1 ? 300 + Math.random() * 80 : 900 + Math.random() * 100;
        if (import.meta.env.DEV) {
          console.warn(`[API] ${method} ${endpoint} network error (${duration}ms) -> transient retry ${attempt}/${maxAttempts} in ${Math.round(backoffMs)}ms`);
        }
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      if (import.meta.env.DEV) {
        console.error(`[API] ${method} ${endpoint} network failure (${duration}ms):`, networkErr.message);
      }
      throw new Error(
        networkErr.name === 'TypeError' && (networkErr.message === 'Load failed' || networkErr.message === 'Failed to fetch')
          ? 'Unable to connect to FastAPI backend server. Please verify VITE_API_URL and backend deployment health.'
          : (networkErr.message || 'Network request failed')
      );
    }

    const duration = Date.now() - startTime;

    // 1. Success Response
    if (response.ok) {
      if (import.meta.env.DEV) {
        console.debug(`[API] ${method} ${endpoint} ${response.status} OK (${duration}ms)`);
      }
      return await response.json();
    }

    // 2. 401 Unauthorized -> Refresh via Single-Flight Mutex & Retry Once
    if (response.status === 401 && isProtected) {
      if (isRetry) {
        // Prevent infinite loops: already refreshed once and still got 401
        const errBody = await response.json().catch(() => ({ detail: 'Session expired' }));
        if (import.meta.env.DEV) {
          console.error(`[API] ${method} ${endpoint} 401 SESSION_UNRECOVERABLE (${duration}ms)`);
        }
        throw new Error(errBody.detail || 'Your secure session has expired. Please sign in again.');
      }

      if (import.meta.env.DEV) {
        console.warn(`[API] ${method} ${endpoint} 401 SESSION_EXPIRED (${duration}ms) -> acquiring single-flight refresh lock`);
      }

      const freshToken = await sessionManager.refreshSession();
      if (freshToken) {
        return request<T>(endpoint, options, true);
      } else {
        throw new Error('Your secure session has expired. Please sign in again.');
      }
    }

    // 3. 403 Forbidden -> Hard Permission Failure (Never refresh, never retry)
    if (response.status === 403) {
      const errBody = await response.json().catch(() => ({ detail: 'Access Denied' }));
      if (import.meta.env.DEV) {
        console.error(`[API] ${method} ${endpoint} 403 FORBIDDEN (${duration}ms)`);
      }
      throw new Error(errBody.detail || 'Access Denied: You do not have permission for this resource.');
    }

    // 4. Transient HTTP Status (408, 429, 502, 503, 504) -> Retry bounded on safe GET
    const isTransientStatus = [408, 429, 502, 503, 504].includes(response.status);
    if (isSafeGet && isTransientStatus && attempt < maxAttempts) {
      const backoffMs = attempt === 1 ? 300 + Math.random() * 80 : 900 + Math.random() * 100;
      if (import.meta.env.DEV) {
        console.warn(`[API] ${method} ${endpoint} HTTP ${response.status} TRANSIENT (${duration}ms) -> retry ${attempt}/${maxAttempts} in ${Math.round(backoffMs)}ms`);
      }
      await new Promise((r) => setTimeout(r, backoffMs));
      continue;
    }

    // 5. Server or Validation Error
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    const errMsg = errorBody.detail || errorBody.message || `HTTP error ${response.status}`;
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${method} ${endpoint} HTTP ${response.status} (${duration}ms):`, errMsg);
    }
    throw new Error(errMsg);
  }

  throw new Error(`Request failed after ${maxAttempts} attempts.`);
}

export const api = {
  // Public Endpoint Accessors
  event: {
    get: () => request<{ success: boolean; data: any }>('/api/event-details'),
    update: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/event-details', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  about: {
    get: () => request<{ success: boolean; data: any }>('/api/about'),
    update: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/about', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: () =>
      request<{ success: boolean; data: any }>('/api/admin/about', {
        method: 'DELETE',
      }),
    reset: () =>
      request<{ success: boolean; data: any }>('/api/admin/about/reset', {
        method: 'POST',
      }),
  },
  domains: {
    get: () => request<{ success: boolean; data: any[] }>('/api/domains'),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/domains', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/domains/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/domains/${id}`, {
        method: 'DELETE',
      }),
  },
  schedule: {
    get: () => request<{ success: boolean; data: any[] }>('/api/schedule'),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/schedule/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/schedule/${id}`, {
        method: 'DELETE',
      }),
  },
  rules: {
    get: () => request<{ success: boolean; data: any }>('/api/rules'),
    update: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/rules', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  faqs: {
    get: () => request<{ success: boolean; data: any[] }>('/api/faqs'),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/faqs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/faqs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
      }),
  },
  sponsors: {
    get: () => request<{ success: boolean; data: any[] }>('/api/sponsors'),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/sponsors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/sponsors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/sponsors/${id}`, {
        method: 'DELETE',
      }),
    uploadLogo: (formData: FormData) =>
      request<{ success: boolean; url: string; filename: string }>('/api/admin/sponsors/upload', {
        method: 'POST',
        body: formData,
      }),
  },
  publicSettings: {
    get: () => request<{
      event_name: string;
      event_date: string;
      registration_status: string;
      sru_registration_open: boolean;
      external_registration_open: boolean;
      registration_open_date: string;
      registration_close_date: string;
      website_visibility: string;
      event_status: string;
    }>('/api/settings/public'),
  },
  contact: {
    getSettings: () => request<{ success: boolean; data: any }>('/api/contact'),
    updateSettings: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/contact', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getPeople: () => request<{ success: boolean; data: any[] }>('/api/contact/people'),
    createPerson: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/contact/people', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updatePerson: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/contact/people/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deletePerson: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/contact/people/${id}`, {
        method: 'DELETE',
      }),
  },
  testimonials: {
    get: () => request<{ success: boolean; data: any[] }>('/api/testimonials'),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
      }),
    uploadMedia: (formData: FormData) =>
      request<{ success: boolean; url: string; media_type: string }>('/api/admin/testimonials/upload', {
        method: 'POST',
        body: formData,
      }),
  },
  registrations: {
    list: () => request<{ success: boolean; data: any[] }>('/api/admin/registrations'),
    get: (id: string) => request<{ success: boolean; data: any }>(`/api/admin/registrations/${id}`),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/registrations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string; registration_id?: string }>(`/api/admin/registrations/${id}`, {
        method: 'DELETE',
      }),
    stats: () => request<{ success: boolean; data: any }>('/api/admin/stats'),
    getEmailLogs: (id: string) => request<{ success: boolean; data: any[] }>(`/api/admin/registrations/${id}/emails`),
    resendEmail: (id: string, memberId?: string) =>
      request<{ success: boolean; message: string; results?: any }>(
        `/api/admin/registrations/${id}/resend-email${memberId ? `?member_id=${memberId}` : ''}`,
        { method: 'POST' }
      ),
    uploadPaymentProof: async (registrationId: string, file: File, transactionId?: string) => {
      const formData = new FormData();
      formData.append('registration_id', registrationId);
      if (transactionId) {
        formData.append('transaction_id', transactionId);
      }
      formData.append('file', file);
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/payments/upload-proof`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(err.detail || err.message || 'Payment proof upload failed.');
      }
      return await response.json();
    },
    getPaymentProofUrl: (id: string) =>
      request<{ success: boolean; signed_url: string; payment_proof_path: string }>(`/api/admin/payments/${id}/proof`),
    approvePayment: (id: string, notes?: string) =>
      request<{ success: boolean; message: string; data: any }>(`/api/admin/payments/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    rejectPayment: (id: string, reason?: string) =>
      request<{ success: boolean; message: string; data: any }>(`/api/admin/payments/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Named Admin API Namespace
  admin: {
    getEventDetails: () => request<{ success: boolean; data: any }>('/api/admin/event-details'),
    updateEventDetails: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/event-details', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getAbout: () => request<{ success: boolean; data: any }>('/api/admin/about'),
    updateAbout: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/about', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getDomains: () => request<{ success: boolean; data: any[] }>('/api/admin/domains'),
    createDomain: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/domains', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateDomain: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/domains/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteDomain: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/domains/${id}`, {
        method: 'DELETE',
      }),

    getSchedule: () => request<{ success: boolean; data: any[] }>('/api/admin/schedule'),
    createSchedule: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateSchedule: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/schedule/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteSchedule: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/schedule/${id}`, {
        method: 'DELETE',
      }),

    getRules: () => request<{ success: boolean; data: { content: string } }>('/api/admin/rules'),
    updateRules: (data: { content: string }) =>
      request<{ success: boolean; data: { content: string } }>('/api/admin/rules', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getFaqs: () => request<{ success: boolean; data: any[] }>('/api/admin/faqs'),
    createFaq: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/faqs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateFaq: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/faqs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteFaq: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
      }),

    getSponsors: () => request<{ success: boolean; data: any[] }>('/api/admin/sponsors'),
    createSponsor: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/sponsors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateSponsor: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/sponsors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteSponsor: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/sponsors/${id}`, {
        method: 'DELETE',
      }),

    getContact: () => request<{ success: boolean; data: any }>('/api/admin/contact'),
    updateContact: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/contact', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getTestimonials: () => request<{ success: boolean; data: any[] }>('/api/admin/testimonials'),
    createTestimonial: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTestimonial: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteTestimonial: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
      }),
    uploadTestimonialMedia: (formData: FormData) =>
      request<{ success: boolean; url: string; media_type: string }>('/api/admin/testimonials/upload', {
        method: 'POST',
        body: formData,
      }),

    getRegistrations: () => request<{ success: boolean; data: any[] }>('/api/admin/registrations'),
    getRegistration: (id: string) => request<{ success: boolean; data: any }>(`/api/admin/registrations/${id}`),
    updateRegistration: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/registrations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteRegistration: (id: string) =>
      request<{ success: boolean; message: string; registration_id?: string }>(`/api/admin/registrations/${id}`, {
        method: 'DELETE',
      }),
    getStats: () => request<{ success: boolean; data: any }>('/api/admin/stats'),

    getSettings: () => request<{ success: boolean; data: any }>('/api/admin/settings'),
    updateSettings: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    resetSettings: (section?: string) =>
      request<{ success: boolean; data: any }>(
        `/api/admin/settings/reset${section ? `?section=${section}` : ''}`,
        { method: 'POST' }
      ),

    getRoles: () => request<{ success: boolean; data: any[] }>('/api/admin/roles'),
    createRole: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateRole: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteRole: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/roles/${id}`, {
        method: 'DELETE',
      }),

    getAuditLogs: (limit: number = 30) =>
      request<{ success: boolean; data: any[] }>(`/api/admin/audit-logs?limit=${limit}`),
  },

  results: {
    get: () => request<AdminResultsResponse>('/api/admin/results'),
    deleteEvaluation: (evaluationId: string, resetReason: string) =>
      request<{ success: boolean; message: string; deleted_id: string; audit_id?: string }>(
        `/api/admin/results/evaluations/${evaluationId}?reset_reason=${encodeURIComponent(resetReason)}`,
        { method: 'DELETE' }
      ),
    getMarksExport: (themeId?: string, projectIds?: string[]) => {
      const params = new URLSearchParams();
      if (themeId) params.append('theme_id', themeId);
      if (projectIds && projectIds.length > 0) {
        projectIds.forEach((id) => params.append('project_id', id));
      }
      const qs = params.toString();
      return request<MarksExportResponse>(`/api/admin/results/export-marks${qs ? `?${qs}` : ''}`);
    },
  },

  juries: {
    list: () => request<JuryProfile[]>('/api/admin/juries'),
    create: (data: { name: string; email: string; department: string; temporaryPassword?: string; isActive?: boolean }) =>
      request<{ success: boolean; message: string; user?: any }>('/api/admin/juries', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (judgeUserId: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/juries/${judgeUserId}`, {
        method: 'DELETE',
      }),
    getCandidates: (domainId: string, forJudgeUserId?: string) =>
      request<AssignmentCandidatesResponse>(
        `/api/admin/juries/assignment-candidates?domain_id=${encodeURIComponent(domainId)}${
          forJudgeUserId ? `&for_judge_user_id=${encodeURIComponent(forJudgeUserId)}` : ''
        }`
      ),
    updateProfile: (judgeUserId: string, data: { name?: string; department?: string; is_active?: boolean }) =>
      request<{ success: boolean; message: string }>(`/api/admin/juries/${judgeUserId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    resetPassword: (judgeUserId: string, temporaryPassword?: string) =>
      request<ResetJuryPasswordResponse>(`/api/admin/juries/${judgeUserId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(temporaryPassword ? { temporary_password: temporaryPassword } : {}),
      }),
    getAssignments: (judgeUserId: string) =>
      request<DomainAssignmentItem[]>(`/api/admin/juries/${judgeUserId}/assignments`),
    assignDomain: (judgeUserId: string, data: { domain_id: string; assignment_mode: 'ALL' | 'SELECTED' }) =>
      request<{ success: boolean; assignment: any }>(`/api/admin/juries/${judgeUserId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateAssignmentMode: (assignmentId: string, assignmentMode: 'ALL' | 'SELECTED') =>
      request<{ success: boolean; message: string }>(`/api/admin/jury-domain-assignments/${assignmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignment_mode: assignmentMode }),
      }),
    removeAssignment: (assignmentId: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/jury-domain-assignments/${assignmentId}`, {
        method: 'DELETE',
      }),
    getSelectedProjects: (assignmentId: string) =>
      request<ProjectAssignmentItem[]>(`/api/admin/jury-domain-assignments/${assignmentId}/projects`),
    addSelectedProjects: (assignmentId: string, registrationIds: string[]) =>
      request<{ success: boolean; added_count: number }>(`/api/admin/jury-domain-assignments/${assignmentId}/projects`, {
        method: 'POST',
        body: JSON.stringify({ registration_ids: registrationIds }),
      }),
    removeSelectedProject: (projectAssignmentId: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/jury-project-assignments/${projectAssignmentId}`, {
        method: 'DELETE',
      }),
    getCompletionOverview: () =>
      request<JuryCompletionOverviewResponse>('/api/admin/juries/completion-overview'),
    getProjectProgress: (judgeUserId: string) =>
      request<JuryProjectProgressResponse>(`/api/admin/juries/${judgeUserId}/project-progress`),
    getAssignedProjects: () =>
      request<AssignedProjectsResponse>('/api/jury/assigned-projects'),
    getAssignedProjectById: (registrationId: string) =>
      request<AssignedProjectItem>(`/api/jury/assigned-projects/${registrationId}`),
    bootstrap: () =>
      request<JuryBootstrapResponse>('/api/jury/bootstrap'),
  },
};
