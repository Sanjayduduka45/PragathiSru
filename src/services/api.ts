/**
 * Centralized API client for PRAGATHI 2K26 Expo Application.
 * All frontend requests (Public & Admin Dashboard) call the FastAPI Python backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    throw err;
  }
}

export const api = {
  // Event Details
  event: {
    get: () => request<{ success: boolean; data: any }>('/api/event'),
    update: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/event', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  // About Content
  about: {
    get: () => request<{ success: boolean; data: any }>('/api/about'),
    update: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/about', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  // Project Domains
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
  // Schedule Items
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
  // Rules & Guidelines
  rules: {
    get: () => request<{ success: boolean; data: { content: string } }>('/api/rules'),
    update: (data: { content: string }) =>
      request<{ success: boolean; data: { content: string } }>('/api/admin/rules', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  // FAQs
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
  // Sponsors
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
  // Contact
  contact: {
    get: () => request<{ success: boolean; data: any }>('/api/contact'),
    update: (data: any) =>
      request<{ success: boolean; data: any }>('/api/admin/contact', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  // Registrations Management
  registrations: {
    list: () => request<{ success: boolean; data: any[] }>('/api/admin/registrations'),
    get: (id: string) => request<{ success: boolean; data: any }>(`/api/admin/registrations/${id}`),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/api/admin/registrations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/registrations/${id}`, {
        method: 'DELETE',
      }),
    stats: () => request<{ success: boolean; data: any }>('/api/admin/stats'),
  },
};
