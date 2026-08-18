-- =========================================================================
-- PRAGATHI 2K26 — PHASE 2 JURY & EVALUATIONS STRICT SECURITY MIGRATION
-- =========================================================================
-- This migration establishes recursion-free Row Level Security (RLS) policies,
-- current-user scoped SECURITY DEFINER helper functions, duplicate evaluation
-- protection, and safe association of the existing admin account.
--
-- Security Guarantees:
-- 1. NO RLS RECURSION: Helper functions use SECURITY DEFINER with fixed search_path,
--    eliminating infinite recursion when evaluating public.user_roles policies.
-- 2. NO ARBITRARY ROLE PROBING: Helpers take NO user ID argument; they operate
--    exclusively on auth.uid() of the currently authenticated session.
-- 3. ANONYMOUS BLOCKED: Anonymous users cannot SELECT, INSERT, UPDATE, or DELETE evaluations.
-- 4. PARTICIPANTS BLOCKED: Participants cannot view, submit, or modify evaluations.
-- 5. NO IMPERSONATION: Juries can INSERT evaluations ONLY when auth.uid() = judge_id.
-- 6. OWNERSHIP ISOLATION: Juries can SELECT and UPDATE ONLY their own evaluations (judge_id = auth.uid()).
-- 7. DUPLICATE PROTECTION: Safely applies UNIQUE(judge_id, registration_id).
-- 8. ADMIN PRESERVED: Automatically links adminsupragathi@sru.edu.in to role = 'admin'.
-- =========================================================================

-- =========================================================================
-- STEP 1: ENSURE USER_ROLES STRUCTURE & CONSTRAINTS
-- =========================================================================
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

-- Ensure unique constraint on user_id for conflict handling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND constraint_name = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN others THEN NULL;
END $$;

-- =========================================================================
-- STEP 2: CURRENT-USER SCOPED SECURITY DEFINER FUNCTIONS
-- =========================================================================
-- These functions take ZERO user ID parameters, operating strictly on auth.uid().
-- They cannot be used to probe other users' roles, and they avoid RLS recursion.

CREATE OR REPLACE FUNCTION public.has_current_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = v_uid
      AND role = ANY(required_roles)
      AND (is_active IS NULL OR is_active = TRUE)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.has_current_role(ARRAY['admin', 'superadmin', 'coordinator']);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_jury()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.has_current_role(ARRAY['jury', 'judge']);
END;
$$;

-- Drop any older parameterized functions to prevent arbitrary probing
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT[]);
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.is_jury(UUID);

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.has_current_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_jury() TO authenticated;

-- =========================================================================
-- STEP 3: RECURSION-FREE RLS POLICIES ON PUBLIC.USER_ROLES
-- =========================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user to read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admin full access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role_or_admin_read_all" ON public.user_roles;
DROP POLICY IF EXISTS "admin_manage_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all_policy" ON public.user_roles;

-- SELECT Policy: Current user can read ONLY their own role; Admins can read all roles.
CREATE POLICY "user_roles_select_policy"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  public.is_current_admin()
);

-- MANAGEMENT Policy: Only admins can INSERT, UPDATE, or DELETE user_roles.
CREATE POLICY "user_roles_admin_all_policy"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.is_current_admin()
)
WITH CHECK (
  public.is_current_admin()
);

-- =========================================================================
-- STEP 4: ASSOCIATE CURRENT ADMIN ACCOUNT (adminsupragathi@sru.edu.in)
-- =========================================================================
DO $$
DECLARE
  v_admin_user_id UUID;
BEGIN
  -- Look up existing Auth user ID by email
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE lower(email) = lower('adminsupragathi@sru.edu.in')
  LIMIT 1;

  IF v_admin_user_id IS NOT NULL THEN
    -- Check if is_active column exists in user_roles
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'is_active'
    ) THEN
      INSERT INTO public.user_roles (user_id, role, is_active)
      VALUES (v_admin_user_id, 'admin', TRUE)
      ON CONFLICT (user_id)
      DO UPDATE SET role = 'admin', is_active = TRUE;
    ELSE
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_admin_user_id, 'admin')
      ON CONFLICT (user_id)
      DO UPDATE SET role = 'admin';
    END IF;

    RAISE NOTICE 'Admin account (adminsupragathi@sru.edu.in -> %) successfully associated with role = admin.', v_admin_user_id;
  ELSE
    RAISE NOTICE 'Notice: Auth user adminsupragathi@sru.edu.in not found in auth.users.';
  END IF;
END $$;

-- =========================================================================
-- STEP 5: JUDGE_EVALUATIONS TABLE STRUCTURE & DUPLICATE PROTECTION
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.judge_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  judge_email TEXT NOT NULL,
  judge_name TEXT NOT NULL,
  registration_id TEXT NOT NULL REFERENCES public.registrations(registration_id) ON DELETE CASCADE,
  team_name TEXT DEFAULT '',
  project_title TEXT DEFAULT '',
  category TEXT DEFAULT '',
  innovation_score NUMERIC NOT NULL DEFAULT 0 CHECK (innovation_score >= 0 AND innovation_score <= 20),
  technical_score NUMERIC NOT NULL DEFAULT 0 CHECK (technical_score >= 0 AND technical_score <= 20),
  relevance_score NUMERIC NOT NULL DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 20),
  presentation_score NUMERIC NOT NULL DEFAULT 0 CHECK (presentation_score >= 0 AND presentation_score <= 20),
  impact_score NUMERIC NOT NULL DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 20),
  criteria_scores JSONB DEFAULT '{}'::jsonb,
  total_score NUMERIC NOT NULL DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
  comments TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure judge_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'judge_evaluations' AND column_name = 'judge_id'
  ) THEN
    ALTER TABLE public.judge_evaluations ADD COLUMN judge_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Duplicate Evaluation Safety Check:
-- Inspect for existing duplicates before applying UNIQUE constraint
DO $$
DECLARE
  v_dup_count INT := 0;
BEGIN
  SELECT COUNT(*) INTO v_dup_count
  FROM (
    SELECT judge_id, registration_id, COUNT(*)
    FROM public.judge_evaluations
    WHERE judge_id IS NOT NULL
    GROUP BY judge_id, registration_id
    HAVING COUNT(*) > 1
  ) dups;

  IF v_dup_count > 0 THEN
    RAISE NOTICE 'WARNING: % duplicate evaluation group(s) detected on (judge_id, registration_id). Constraint creation deferred.', v_dup_count;
  ELSE
    ALTER TABLE public.judge_evaluations DROP CONSTRAINT IF EXISTS unique_judge_project;
    ALTER TABLE public.judge_evaluations DROP CONSTRAINT IF EXISTS unique_judge_eval_per_project;
    ALTER TABLE public.judge_evaluations ADD CONSTRAINT unique_judge_eval_per_project UNIQUE (judge_id, registration_id);
    RAISE NOTICE 'Unique constraint unique_judge_eval_per_project successfully applied.';
  END IF;
END $$;

-- =========================================================================
-- STEP 6: STRICT RLS POLICIES ON PUBLIC.JUDGE_EVALUATIONS
-- =========================================================================
ALTER TABLE public.judge_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_evaluations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select judge_evaluations" ON public.judge_evaluations;
DROP POLICY IF EXISTS "Allow insert judge_evaluations" ON public.judge_evaluations;
DROP POLICY IF EXISTS "Allow update judge_evaluations" ON public.judge_evaluations;
DROP POLICY IF EXISTS "Allow delete judge_evaluations" ON public.judge_evaluations;
DROP POLICY IF EXISTS "Allow authenticated jury insert" ON public.judge_evaluations;
DROP POLICY IF EXISTS "Allow authenticated jury select" ON public.judge_evaluations;
DROP POLICY IF EXISTS "jury_select_own_or_admin_select_all" ON public.judge_evaluations;
DROP POLICY IF EXISTS "jury_insert_own_evaluations" ON public.judge_evaluations;
DROP POLICY IF EXISTS "jury_update_own_or_admin_update" ON public.judge_evaluations;
DROP POLICY IF EXISTS "admin_delete_evaluations" ON public.judge_evaluations;

-- POLICY A: SELECT (Jury selects ONLY their own evaluations; Admin selects all evaluations)
CREATE POLICY "jury_select_own_or_admin_select_all"
ON public.judge_evaluations
FOR SELECT
TO authenticated
USING (
  (judge_id = auth.uid() AND public.is_current_jury())
  OR
  public.is_current_admin()
);

-- POLICY B: INSERT (Jury inserts ONLY their own evaluations; prevents impersonation)
CREATE POLICY "jury_insert_own_evaluations"
ON public.judge_evaluations
FOR INSERT
TO authenticated
WITH CHECK (
  judge_id = auth.uid()
  AND
  public.is_current_jury()
);

-- POLICY C: UPDATE (Jury updates ONLY their own evaluations; Admin can update)
CREATE POLICY "jury_update_own_or_admin_update"
ON public.judge_evaluations
FOR UPDATE
TO authenticated
USING (
  (judge_id = auth.uid() AND public.is_current_jury())
  OR
  public.is_current_admin()
)
WITH CHECK (
  (judge_id = auth.uid() AND public.is_current_jury())
  OR
  public.is_current_admin()
);

-- POLICY D: DELETE (Admins only)
CREATE POLICY "admin_delete_evaluations"
ON public.judge_evaluations
FOR DELETE
TO authenticated
USING (
  public.is_current_admin()
);

-- =========================================================================
-- STEP 7: PERFORMANCE INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_judge_evaluations_judge_id ON public.judge_evaluations(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_evaluations_reg_id ON public.judge_evaluations(registration_id);
CREATE INDEX IF NOT EXISTS idx_judge_evaluations_total_score ON public.judge_evaluations(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
