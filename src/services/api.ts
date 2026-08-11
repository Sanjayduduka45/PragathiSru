/**
 * Centralized API client for PRAGATHI 2K26 Expo Application.
 * All frontend requests (Public & Admin Dashboard) call the FastAPI Python backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
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
    get: () => request<{ success: boolean; data: { content: string } }>('/api/rules'),
    update: (data: { content: string }) =>
      request<{ success: boolean; data: { content: string } }>('/api/admin/rules', {
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
  },
  contact: {
    get: () => request<{ success: boolean; data: any }>('/api/contact'),
    update: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/contact', {
        method: 'PUT',
        body: JSON.stringify(data),
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
  },
};
