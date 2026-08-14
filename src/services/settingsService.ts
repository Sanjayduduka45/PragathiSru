import { api } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface EventConfig {
  eventName: string;
  eventDate: string;
  targetDateIso: string;
  registrationStatus: 'open' | 'closed' | 'paused';
  registrationOpenDate: string;
  registrationCloseDate: string;
  websiteVisibility: 'published' | 'maintenance';
  eventStatus: 'planning' | 'active' | 'completed';
}

export interface NotificationConfig {
  announcementEmailsEnabled: boolean;
  registrationConfirmationEmailsEnabled: boolean;
  eventReminderAlertsEnabled: boolean;
  emailSenderName: string;
  providerStatus: 'ready' | 'simulated' | 'configured';
}

export interface SystemConfig {
  maintenanceMode: boolean;
  maxRegistrations: number;
  announcementBannerEnabled: boolean;
  announcementBannerText: string;
  debugLogging: boolean;
}

export interface AdminProfile {
  displayName: string;
  email: string;
  role: string;
  accountStatus: string;
  lastSignIn?: string | null;
  authProvider: string;
}

export interface FullSettings {
  event: EventConfig;
  notifications: NotificationConfig;
  system: SystemConfig;
  adminProfile: AdminProfile;
}

export interface UserRoleItem {
  id: string;
  userEmail: string;
  role: 'admin' | 'coordinator' | 'jury' | 'participant';
  displayName: string;
  department: string;
  isActive: boolean;
  assignedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  performedBy: string;
  target: string;
  details: string;
  createdAt?: string;
}

export const DEFAULT_FULL_SETTINGS: FullSettings = {
  event: {
    eventName: 'PRAGATHI 2K26',
    eventDate: '09 October 2026',
    targetDateIso: '2026-10-09T09:00:00+05:30',
    registrationStatus: 'open',
    registrationOpenDate: '2026-08-01T00:00:00+05:30',
    registrationCloseDate: '2026-10-01T23:59:59+05:30',
    websiteVisibility: 'published',
    eventStatus: 'active',
  },
  notifications: {
    announcementEmailsEnabled: true,
    registrationConfirmationEmailsEnabled: true,
    eventReminderAlertsEnabled: true,
    emailSenderName: 'PRAGATHI 2K26 Secretariat',
    providerStatus: 'ready',
  },
  system: {
    maintenanceMode: false,
    maxRegistrations: 500,
    announcementBannerEnabled: false,
    announcementBannerText: 'Welcome to PRAGATHI 2K26 Expo Registration Portal!',
    debugLogging: false,
  },
  adminProfile: {
    displayName: 'Lead Administrator',
    email: 'admin@sru.edu.in',
    role: 'admin',
    accountStatus: 'verified',
    lastSignIn: null,
    authProvider: 'email',
  },
};

export const DEFAULT_USER_ROLES: UserRoleItem[] = [
  {
    id: 'role-admin-1',
    userEmail: 'admin@sru.edu.in',
    role: 'admin',
    displayName: 'Lead Administrator',
    department: 'Deanery',
    isActive: true,
    assignedBy: 'system',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'role-coord-1',
    userEmail: 'coordinator@sru.edu.in',
    role: 'coordinator',
    displayName: 'Chief Event Coordinator',
    department: 'CSE',
    isActive: true,
    assignedBy: 'system',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'role-jury-1',
    userEmail: 'jury.head@sru.edu.in',
    role: 'jury',
    displayName: 'Evaluation Panel Head',
    department: 'Research',
    isActive: true,
    assignedBy: 'system',
    createdAt: '2026-08-01T00:00:00Z',
  },
];

function transformFromBackend(data: any): FullSettings {
  if (!data) return DEFAULT_FULL_SETTINGS;
  const ev = data.event || {};
  const notif = data.notifications || {};
  const sys = data.system || {};
  const adm = data.admin_profile || data.adminProfile || {};

  return {
    event: {
      eventName: ev.event_name ?? DEFAULT_FULL_SETTINGS.event.eventName,
      eventDate: ev.event_date ?? DEFAULT_FULL_SETTINGS.event.eventDate,
      targetDateIso: ev.target_date_iso ?? DEFAULT_FULL_SETTINGS.event.targetDateIso,
      registrationStatus: ev.registration_status ?? DEFAULT_FULL_SETTINGS.event.registrationStatus,
      registrationOpenDate: ev.registration_open_date ?? DEFAULT_FULL_SETTINGS.event.registrationOpenDate,
      registrationCloseDate: ev.registration_close_date ?? DEFAULT_FULL_SETTINGS.event.registrationCloseDate,
      websiteVisibility: ev.website_visibility ?? DEFAULT_FULL_SETTINGS.event.websiteVisibility,
      eventStatus: ev.event_status ?? DEFAULT_FULL_SETTINGS.event.eventStatus,
    },
    notifications: {
      announcementEmailsEnabled: notif.announcement_emails_enabled ?? DEFAULT_FULL_SETTINGS.notifications.announcementEmailsEnabled,
      registrationConfirmationEmailsEnabled: notif.registration_confirmation_emails_enabled ?? DEFAULT_FULL_SETTINGS.notifications.registrationConfirmationEmailsEnabled,
      eventReminderAlertsEnabled: notif.event_reminder_alerts_enabled ?? DEFAULT_FULL_SETTINGS.notifications.eventReminderAlertsEnabled,
      emailSenderName: notif.email_sender_name ?? DEFAULT_FULL_SETTINGS.notifications.emailSenderName,
      providerStatus: notif.provider_status ?? DEFAULT_FULL_SETTINGS.notifications.providerStatus,
    },
    system: {
      maintenanceMode: sys.maintenance_mode ?? DEFAULT_FULL_SETTINGS.system.maintenanceMode,
      maxRegistrations: sys.max_registrations ?? DEFAULT_FULL_SETTINGS.system.maxRegistrations,
      announcementBannerEnabled: sys.announcement_banner_enabled ?? DEFAULT_FULL_SETTINGS.system.announcementBannerEnabled,
      announcementBannerText: sys.announcement_banner_text ?? DEFAULT_FULL_SETTINGS.system.announcementBannerText,
      debugLogging: sys.debug_logging ?? DEFAULT_FULL_SETTINGS.system.debugLogging,
    },
    adminProfile: {
      displayName: adm.display_name ?? DEFAULT_FULL_SETTINGS.adminProfile.displayName,
      email: adm.email ?? DEFAULT_FULL_SETTINGS.adminProfile.email,
      role: adm.role ?? DEFAULT_FULL_SETTINGS.adminProfile.role,
      accountStatus: adm.account_status ?? DEFAULT_FULL_SETTINGS.adminProfile.accountStatus,
      lastSignIn: adm.last_sign_in ?? DEFAULT_FULL_SETTINGS.adminProfile.lastSignIn,
      authProvider: adm.auth_provider ?? DEFAULT_FULL_SETTINGS.adminProfile.authProvider,
    },
  };
}

function transformToBackend(settings: Partial<FullSettings>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (settings.event) {
    payload.event = {
      event_name: settings.event.eventName,
      event_date: settings.event.eventDate,
      target_date_iso: settings.event.targetDateIso,
      registration_status: settings.event.registrationStatus,
      registration_open_date: settings.event.registrationOpenDate,
      registration_close_date: settings.event.registrationCloseDate,
      website_visibility: settings.event.websiteVisibility,
      event_status: settings.event.eventStatus,
    };
  }
  if (settings.notifications) {
    payload.notifications = {
      announcement_emails_enabled: settings.notifications.announcementEmailsEnabled,
      registration_confirmation_emails_enabled: settings.notifications.registrationConfirmationEmailsEnabled,
      event_reminder_alerts_enabled: settings.notifications.eventReminderAlertsEnabled,
      email_sender_name: settings.notifications.emailSenderName,
      provider_status: settings.notifications.providerStatus,
    };
  }
  if (settings.system) {
    payload.system = {
      maintenance_mode: settings.system.maintenanceMode,
      max_registrations: settings.system.maxRegistrations,
      announcement_banner_enabled: settings.system.announcementBannerEnabled,
      announcement_banner_text: settings.system.announcementBannerText,
      debug_logging: settings.system.debugLogging,
    };
  }
  if (settings.adminProfile) {
    payload.admin_profile = {
      display_name: settings.adminProfile.displayName,
      email: settings.adminProfile.email,
      role: settings.adminProfile.role,
      account_status: settings.adminProfile.accountStatus,
    };
  }
  return payload;
}

export async function getAdminSettings(): Promise<FullSettings> {
  try {
    const res = await api.admin.getSettings();
    if (res && res.data) {
      return transformFromBackend(res.data);
    }
  } catch (err) {
    console.warn('[settingsService] getAdminSettings FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('system_settings').select('*');
      if (!error && data && data.length > 0) {
        const merged: Record<string, any> = {};
        for (const row of data) {
          if (row.key === 'event_config') merged.event = row.value;
          if (row.key === 'notification_config') merged.notifications = row.value;
          if (row.key === 'system_config') merged.system = row.value;
          if (row.key === 'admin_profile') merged.admin_profile = row.value;
        }
        return transformFromBackend(merged);
      }
    } catch (sErr) {
      console.warn('[settingsService] getAdminSettings Supabase direct fallback:', sErr);
    }
  }

  return DEFAULT_FULL_SETTINGS;
}

export async function updateAdminSettings(updates: Partial<FullSettings>): Promise<FullSettings> {
  const payload = transformToBackend(updates);
  try {
    const res = await api.admin.updateSettings(payload);
    if (res && res.data) {
      return transformFromBackend(res.data);
    }
  } catch (err) {
    console.warn('[settingsService] updateAdminSettings FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      if (payload.event) {
        await supabase.from('system_settings').upsert({
          key: 'event_config',
          value: payload.event,
          updated_by: 'admin',
        }, { onConflict: 'key' });
      }
      if (payload.notifications) {
        await supabase.from('system_settings').upsert({
          key: 'notification_config',
          value: payload.notifications,
          updated_by: 'admin',
        }, { onConflict: 'key' });
      }
      if (payload.system) {
        await supabase.from('system_settings').upsert({
          key: 'system_config',
          value: payload.system,
          updated_by: 'admin',
        }, { onConflict: 'key' });
      }
      return getAdminSettings();
    }
    throw err;
  }
  return getAdminSettings();
}

export async function resetAdminSettings(section?: string): Promise<FullSettings> {
  try {
    const res = await api.admin.resetSettings(section);
    if (res && res.data) {
      return transformFromBackend(res.data);
    }
  } catch (err) {
    console.warn('[settingsService] resetAdminSettings FastAPI failed:', err);
  }
  return DEFAULT_FULL_SETTINGS;
}

// ─── USER ROLES ─────────────────────────────────────────────────────────────

export async function getUserRoles(): Promise<UserRoleItem[]> {
  try {
    const res = await api.admin.getRoles();
    if (res && res.data && Array.isArray(res.data)) {
      return res.data.map((r: any) => ({
        id: String(r.id),
        userEmail: r.user_email,
        role: r.role,
        displayName: r.display_name || '',
        department: r.department || '',
        isActive: r.is_active ?? true,
        assignedBy: r.assigned_by || 'admin',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
  } catch (err) {
    console.warn('[settingsService] getUserRoles FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: String(r.id),
          userEmail: r.user_email,
          role: r.role,
          displayName: r.display_name || '',
          department: r.department || '',
          isActive: r.is_active ?? true,
          assignedBy: r.assigned_by || 'admin',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch (sErr) {
      console.warn('[settingsService] getUserRoles Supabase direct fallback:', sErr);
    }
  }

  return DEFAULT_USER_ROLES;
}

export async function createUserRole(data: {
  userEmail: string;
  role: 'admin' | 'coordinator' | 'jury' | 'participant';
  displayName?: string;
  department?: string;
  isActive?: boolean;
}): Promise<UserRoleItem> {
  const payload = {
    user_email: data.userEmail.trim().toLowerCase(),
    role: data.role,
    display_name: data.displayName || '',
    department: data.department || '',
    is_active: data.isActive ?? true,
  };

  try {
    const res = await api.admin.createRole(payload);
    if (res && res.data) {
      return {
        id: String(res.data.id),
        userEmail: res.data.user_email,
        role: res.data.role,
        displayName: res.data.display_name,
        department: res.data.department,
        isActive: res.data.is_active,
        assignedBy: res.data.assigned_by,
      };
    }
  } catch (err) {
    console.warn('[settingsService] createUserRole FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { data: supaData, error } = await supabase.from('user_roles').insert([payload]).select().single();
      if (!error && supaData) {
        return {
          id: String(supaData.id),
          userEmail: supaData.user_email,
          role: supaData.role,
          displayName: supaData.display_name,
          department: supaData.department,
          isActive: supaData.is_active,
          assignedBy: supaData.assigned_by,
        };
      }
      if (error) throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }

  return {
    id: `role-${Date.now()}`,
    userEmail: data.userEmail,
    role: data.role,
    displayName: data.displayName || '',
    department: data.department || '',
    isActive: data.isActive ?? true,
    assignedBy: 'admin',
  };
}

export async function updateUserRole(id: string, updates: Partial<UserRoleItem>): Promise<void> {
  const payload: Record<string, any> = {};
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.displayName !== undefined) payload.display_name = updates.displayName;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;

  try {
    await api.admin.updateRole(id, payload);
    return;
  } catch (err) {
    console.warn('[settingsService] updateUserRole FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('user_roles').update(payload).eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function deleteUserRole(id: string): Promise<void> {
  try {
    await api.admin.deleteRole(id);
    return;
  } catch (err) {
    console.warn('[settingsService] deleteUserRole FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('user_roles').delete().eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

// ─── AUDIT LOGS ─────────────────────────────────────────────────────────────

export async function getAuditLogs(limit: number = 30): Promise<AuditLogItem[]> {
  try {
    const res = await api.admin.getAuditLogs(limit);
    if (res && res.data && Array.isArray(res.data)) {
      return res.data.map((l: any) => ({
        id: String(l.id),
        action: l.action,
        performedBy: l.performed_by,
        target: l.target,
        details: l.details,
        createdAt: l.created_at,
      }));
    }
  } catch (err) {
    console.warn('[settingsService] getAuditLogs FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) {
        return data.map((l: any) => ({
          id: String(l.id),
          action: l.action,
          performedBy: l.performed_by,
          target: l.target,
          details: l.details,
          createdAt: l.created_at,
        }));
      }
    } catch (sErr) {
      console.warn('[settingsService] getAuditLogs Supabase direct fallback:', sErr);
    }
  }

  return [];
}
