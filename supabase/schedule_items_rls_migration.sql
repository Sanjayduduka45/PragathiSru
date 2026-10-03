-- =========================================================================
-- PRAGATHI 2K26 — SCHEDULE ITEMS ROW LEVEL SECURITY (RLS) MIGRATION
-- =========================================================================
-- This migration establishes secure, clean Row Level Security (RLS) policies
-- for public.schedule_items:
--
-- Security Guarantees:
-- 1. PUBLIC / ANONYMOUS: Read-only access to schedule items for public display.
--    No public INSERT, UPDATE, or DELETE permissions.
-- 2. AUTHENTICATED ADMIN: Can INSERT, UPDATE, and DELETE schedule items.
-- 3. SERVER-SIDE PRIVILEGED BACKEND: Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- 4. IDEMPOTENT: Safe to run multiple times without errors.
-- =========================================================================

-- Step 1: Ensure RLS is enabled on schedule_items
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

-- Step 2: Clean up any obsolete, conflicting, or duplicate policies
DROP POLICY IF EXISTS "Public read schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "Allow public select schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "public_read_schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "Admin insert schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "Admin update schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "Admin delete schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "admin_insert_schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "admin_update_schedule_items" ON public.schedule_items;
DROP POLICY IF EXISTS "admin_delete_schedule_items" ON public.schedule_items;

-- Step 3: Public Read Policy
-- Allows public visitors and anonymous clients to read schedule items
CREATE POLICY "Public read schedule_items"
  ON public.schedule_items
  FOR SELECT
  USING (true);

-- Step 4: Admin Insert Policy
-- Only verified PRAGATHI administrators can insert
CREATE POLICY "Admin insert schedule_items"
  ON public.schedule_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_current_admin()
  );

-- Step 5: Admin Update Policy
-- Only verified PRAGATHI administrators can update
CREATE POLICY "Admin update schedule_items"
  ON public.schedule_items
  FOR UPDATE
  TO authenticated
  USING (
    public.is_current_admin()
  )
  WITH CHECK (
    public.is_current_admin()
  );

-- Step 6: Admin Delete Policy
-- Only verified PRAGATHI administrators can delete
CREATE POLICY "Admin delete schedule_items"
  ON public.schedule_items
  FOR DELETE
  TO authenticated
  USING (
    public.is_current_admin()
  );

-- Step 7: Ensure Index on display_order for fast ordering
CREATE INDEX IF NOT EXISTS idx_schedule_items_order ON public.schedule_items(display_order);
