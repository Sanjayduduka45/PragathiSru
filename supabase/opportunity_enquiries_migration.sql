-- =========================================================================
-- PRAGATHI 2K26 — OPPORTUNITY ENQUIRIES MIGRATION WITH STRICT ADMIN RLS
-- =========================================================================
-- This migration creates the `opportunity_enquiries` table with strict
-- Row Level Security (RLS) adhering to the project's existing admin
-- authorization architecture (`public.is_current_admin()`).
--
-- Security Guarantees:
-- 1. PUBLIC / ANONYMOUS: Can INSERT enquiries. Cannot SELECT, UPDATE, or DELETE.
-- 2. NON-ADMIN AUTHENTICATED: Cannot SELECT, UPDATE, or DELETE enquiries.
-- 3. AUTHORIZED PRAGATHI ADMIN: Can SELECT, UPDATE status, and DELETE enquiries.
-- 4. NO RLS RECURSION: Leverages SECURITY DEFINER helper with fixed search_path.
-- =========================================================================

-- Step 1: Create Table
CREATE TABLE IF NOT EXISTS public.opportunity_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  organization TEXT DEFAULT '',
  designation TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Ensure Helper Role Functions Exist (Idempotent Definition)
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

GRANT EXECUTE ON FUNCTION public.has_current_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_admin() TO authenticated;

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.opportunity_enquiries ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing/legacy policies on opportunity_enquiries
DROP POLICY IF EXISTS "public_insert_opportunity_enquiries" ON public.opportunity_enquiries;
DROP POLICY IF EXISTS "Public insert opportunity_enquiries" ON public.opportunity_enquiries;
DROP POLICY IF EXISTS "admin_select_opportunity_enquiries" ON public.opportunity_enquiries;
DROP POLICY IF EXISTS "Admin select opportunity_enquiries" ON public.opportunity_enquiries;
DROP POLICY IF EXISTS "admin_update_opportunity_enquiries" ON public.opportunity_enquiries;
DROP POLICY IF EXISTS "Admin update opportunity_enquiries" ON public.opportunity_enquiries;
DROP POLICY IF EXISTS "admin_delete_opportunity_enquiries" ON public.opportunity_enquiries;
DROP POLICY IF EXISTS "Admin delete opportunity_enquiries" ON public.opportunity_enquiries;

-- Step 5: Create Strict RLS Policies

-- Policy A: Public Insert (Anyone on the public website can submit an enquiry)
CREATE POLICY "public_insert_opportunity_enquiries"
  ON public.opportunity_enquiries
  FOR INSERT
  WITH CHECK (true);

-- Policy B: Admin Select (Only authorized PRAGATHI Admins can view enquiries)
CREATE POLICY "admin_select_opportunity_enquiries"
  ON public.opportunity_enquiries
  FOR SELECT
  TO authenticated
  USING (
    public.is_current_admin()
  );

-- Policy C: Admin Update (Only authorized PRAGATHI Admins can update status)
CREATE POLICY "admin_update_opportunity_enquiries"
  ON public.opportunity_enquiries
  FOR UPDATE
  TO authenticated
  USING (
    public.is_current_admin()
  )
  WITH CHECK (
    public.is_current_admin()
  );

-- Policy D: Admin Delete (Only authorized PRAGATHI Admins can delete enquiries)
CREATE POLICY "admin_delete_opportunity_enquiries"
  ON public.opportunity_enquiries
  FOR DELETE
  TO authenticated
  USING (
    public.is_current_admin()
  );

-- Step 6: Performance Indexes
CREATE INDEX IF NOT EXISTS idx_opportunity_enquiries_status ON public.opportunity_enquiries (status);
CREATE INDEX IF NOT EXISTS idx_opportunity_enquiries_created_at ON public.opportunity_enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_enquiries_opp_name ON public.opportunity_enquiries (opportunity_name);
