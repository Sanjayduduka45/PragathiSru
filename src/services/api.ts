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
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET_KEY || 'pragathi_admin_secret_key_2026';

// ─── Fast In-Memory Session Token Cache ─────────────────────────────────────────
let cachedAuthToken: string | null = null;
let tokenExpiresAt: number = 0;

export function setApiAuthToken(token: string | null, expiresInSeconds: number = 3600) {
  cachedAuthToken = token;
  tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAuthToken = session?.access_token || null;
    tokenExpiresAt = session?.expires_in ? Date.now() + session.expires_in * 1000 : 0;
  });
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const isResultsEndpoint = endpoint.startsWith('/api/admin/results');
  const isJuryAdminEndpoint = endpoint.startsWith('/api/admin/juries') || endpoint.startsWith('/api/admin/jury-');
  const isJuryEndpoint = endpoint.startsWith('/api/jury');
  const isLegacyAdminEndpoint = endpoint.startsWith('/api/admin/') && !isResultsEndpoint && !isJuryAdminEndpoint;
  const isFormData = options?.body instanceof FormData;

  let authToken: string | null = cachedAuthToken;
  if ((isLegacyAdminEndpoint || isResultsEndpoint || isJuryAdminEndpoint || isJuryEndpoint) && supabase) {
    if (!authToken || Date.now() >= tokenExpiresAt) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
        if (authToken && session?.expires_in) {
          setApiAuthToken(authToken, session.expires_in);
        }
      } catch {
        // ignore session lookup errors
      }
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...((isLegacyAdminEndpoint || isJuryAdminEndpoint) ? { 'X-Admin-Secret': ADMIN_SECRET } : {}),
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorBody.detail || errorBody.message || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error(`[API Error] ${options?.method || 'GET'} ${endpoint}:`, err);
    if (err.name === 'TypeError' && (err.message === 'Load failed' || err.message === 'Failed to fetch')) {
      throw new Error('Unable to connect to FastAPI backend server. Please verify VITE_API_URL and backend deployment health.');
    }
    throw err;
  }
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
  },

  juries: {
    list: () => request<JuryProfile[]>('/api/admin/juries'),
    updateProfile: (judgeUserId: string, data: { name?: string; department?: string; is_active?: boolean }) =>
      request<{ success: boolean; message: string }>(`/api/admin/juries/${judgeUserId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
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
