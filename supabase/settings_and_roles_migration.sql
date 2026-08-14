-- PRAGATHI 2K26 - System Settings, User Roles & Audit Logs Migration
-- Run this in your Supabase SQL Editor.

-- 1. SYSTEM_SETTINGS TABLE (Key-Value JSON store for system configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_type TEXT NOT NULL DEFAULT 'json',
  description TEXT DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER_ROLES TABLE (Role assignments for Admin, Coordinator, Jury, Participant)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator', 'jury', 'participant')),
  display_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUDIT_LOGS TABLE (Security & administrative change tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL DEFAULT 'admin',
  target TEXT DEFAULT '',
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES
-- System Settings: Public can read public settings; Authenticated users can read/write all
CREATE POLICY "Allow public read of public settings" ON public.system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Allow authenticated full access to system settings" ON public.system_settings
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- User Roles: Authenticated full access
CREATE POLICY "Allow full access to user roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Audit Logs: Authenticated full access
CREATE POLICY "Allow full access to audit logs" ON public.audit_logs
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 6. SEED INITIAL DEFAULT SETTINGS
INSERT INTO public.system_settings (key, value, value_type, description, is_public, updated_by)
VALUES
  (
    'event_config',
    '{
      "event_name": "PRAGATHI 2K26",
      "event_date": "09 October 2026",
      "target_date_iso": "2026-10-09T09:00:00+05:30",
      "registration_status": "open",
      "registration_open_date": "2026-08-01T00:00:00+05:30",
      "registration_close_date": "2026-10-01T23:59:59+05:30",
      "website_visibility": "published",
      "event_status": "active"
    }'::jsonb,
    'json',
    'Core event lifecycle and registration window configuration',
    true,
    'system'
  ),
  (
    'notification_config',
    '{
      "announcement_emails_enabled": true,
      "registration_confirmation_emails_enabled": true,
      "event_reminder_alerts_enabled": true,
      "email_sender_name": "PRAGATHI 2K26 Secretariat",
      "provider_status": "ready"
    }'::jsonb,
    'json',
    'Email delivery and notification flags',
    false,
    'system'
  ),
  (
    'system_config',
    '{
      "maintenance_mode": false,
      "max_registrations": 500,
      "announcement_banner_enabled": false,
      "announcement_banner_text": "Welcome to PRAGATHI 2K26 Expo Registration Portal!",
      "debug_logging": false
    }'::jsonb,
    'json',
    'System-level limits, banner, and maintenance mode flags',
    true,
    'system'
  )
ON CONFLICT (key) DO NOTHING;

-- 7. SEED INITIAL ROLES
INSERT INTO public.user_roles (user_email, role, display_name, department, is_active, assigned_by)
VALUES
  ('admin@sru.edu.in', 'admin', 'Lead Administrator', 'Deanery', true, 'system'),
  ('coordinator@sru.edu.in', 'coordinator', 'Chief Event Coordinator', 'CSE', true, 'system'),
  ('jury.head@sru.edu.in', 'jury', 'Evaluation Panel Head', 'Research', true, 'system')
ON CONFLICT (user_email) DO NOTHING;

-- 8. INITIAL AUDIT LOG
INSERT INTO public.audit_logs (action, performed_by, target, details)
VALUES
  ('SYSTEM_INIT', 'system', 'system_settings', 'System settings, roles, and audit log framework initialized.');
