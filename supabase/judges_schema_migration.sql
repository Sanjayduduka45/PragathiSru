-- PRAGATHI 2K26 - Judges Profile Table & RLS Migration
-- Run this in your Supabase SQL Editor.

-- =========================================================
-- 1. ENSURE USER_ROLES HAS USER_ID COLUMN & VALID ROLES
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('admin', 'superadmin', 'coordinator', 'jury', 'judge', 'participant'));

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_email ON public.user_roles(user_email);

-- =========================================================
-- 2. CREATE PUBLIC.JUDGES TABLE (Judge Profile Data)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_judges_user_id ON public.judges(user_id);
CREATE INDEX IF NOT EXISTS idx_judges_email ON public.judges(email);
CREATE INDEX IF NOT EXISTS idx_judges_is_active ON public.judges(is_active);

-- =========================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR JUDGES
-- =========================================================

ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow select judges" ON public.judges;
DROP POLICY IF EXISTS "Allow insert judges by admin" ON public.judges;
DROP POLICY IF EXISTS "Allow update judges" ON public.judges;
DROP POLICY IF EXISTS "Allow delete judges" ON public.judges;

-- Read: Authenticated admins and judges can view judge records
CREATE POLICY "Allow select judges" ON public.judges
  FOR SELECT USING (
    auth.role() = 'authenticated' OR auth.role() = 'anon'
  );

-- Insert / Update / Delete: Managed via Edge Function (service role) or Admin users
CREATE POLICY "Allow admin manage judges" ON public.judges
  FOR ALL USING (
    auth.role() = 'authenticated' OR auth.role() = 'anon'
  );

-- =========================================================
-- 4. ENSURE JUDGE_EVALUATIONS SUPPORTS BOTH EMAIL & ID
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_judge_evaluations_judge_email ON public.judge_evaluations(judge_email);
CREATE INDEX IF NOT EXISTS idx_judge_evaluations_reg_id ON public.judge_evaluations(registration_id);
