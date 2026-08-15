-- PRAGATHI 2K26 - Registration Confirmation Email Logs Migration
-- Run this in your Supabase SQL Editor to enable email delivery tracking.

-- 1. REGISTRATION_EMAIL_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.registration_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  registration_code TEXT NOT NULL,
  member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('Leader', 'Member')),
  email_type TEXT NOT NULL DEFAULT 'registration_confirmation',
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.registration_email_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
CREATE POLICY "Allow public select registration_email_logs" ON public.registration_email_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert registration_email_logs" ON public.registration_email_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update registration_email_logs" ON public.registration_email_logs
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete registration_email_logs" ON public.registration_email_logs
  FOR DELETE USING (true);

-- Authenticated Admin Policies
CREATE POLICY "Allow authenticated full access to registration_email_logs" ON public.registration_email_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_reg_email_logs_reg_id ON public.registration_email_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_reg_email_logs_reg_code ON public.registration_email_logs(registration_code);
CREATE INDEX IF NOT EXISTS idx_reg_email_logs_email ON public.registration_email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_reg_email_logs_status ON public.registration_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_reg_email_logs_created_at ON public.registration_email_logs(created_at DESC);
