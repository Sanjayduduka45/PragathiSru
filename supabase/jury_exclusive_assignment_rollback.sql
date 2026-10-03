-- =========================================================================
-- PRAGATHI 2K26 — JURY EXCLUSIVE PROJECT ASSIGNMENT MIGRATION ROLLBACK
-- =========================================================================
-- Purpose: Safely rolls back the exclusive assignment migration objects
-- (indexes, triggers, trigger functions, and RPC functions).
--
-- TARGET: MANUAL DBA EXECUTION ONLY IF ROLLBACK IS REQUIRED.
-- DATA SAFETY: Does NOT drop or delete existing table data or evaluations.
-- =========================================================================

BEGIN;

-- 1. Drop Authoritative RPC Functions
DROP FUNCTION IF EXISTS public.add_jury_selected_projects_exclusive(UUID, TEXT[], UUID);
DROP FUNCTION IF EXISTS public.assign_jury_domain_exclusive(UUID, TEXT, TEXT, UUID);

-- 2. Drop Domain ALL Mode Trigger & Function
DROP TRIGGER IF EXISTS trg_check_domain_all_exclusive_assignment ON public.jury_domain_assignments;
DROP FUNCTION IF EXISTS public.check_domain_all_exclusive_assignment();

-- 3. Drop Project Assignment Exclusive Trigger & Function
DROP TRIGGER IF EXISTS trg_check_project_exclusive_assignment ON public.jury_project_assignments;
DROP FUNCTION IF EXISTS public.check_project_exclusive_assignment();

-- 4. Drop Unique Indexes
DROP INDEX IF EXISTS public.idx_jury_project_assignments_unique_reg;
DROP INDEX IF EXISTS public.idx_jury_domain_single_active_all;

COMMIT;
