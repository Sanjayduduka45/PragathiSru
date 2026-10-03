-- =========================================================================
-- PRAGATHI 2K26 — COMPLETE DYNAMIC JURY MANAGEMENT MIGRATION (HARDENED)
-- =========================================================================
-- STAGE A: Additive migration for dynamic Jury -> Domain / Project Assignments,
-- Domain Aliases, Atomic Evaluation Reset with Audit Trail, and Hardened RLS.
--
-- STRICT ARCHITECTURAL & PRODUCTION HARDENING RULES:
-- 1. public.project_domains.id IS TEXT (e.g. 'ai-software', 'domain-c0677a05').
--    DO NOT cast or convert to UUID.
-- 2. Canonical Jury Identity is judge_user_id UUID referencing public.judges(user_id).
-- 3. Project Assignment Identity is registration_id TEXT referencing public.registrations(registration_id).
-- 4. No updates or modifications to existing live registrations, projects, or project_domains records.
-- 5. DIRECT CLIENT WRITES REMOVED: Frontend clients cannot directly INSERT/UPDATE/DELETE
--    assignment records or audit logs via Supabase PostgREST. All mutations are authoritative
--    through FastAPI backend service-role access.
-- 6. AUDIT IMMUTABILITY: evaluation_reset_audit is append-only via atomic_reset_evaluation RPC.
-- 7. SECURITY PROBING PREVENTION: is_project_assigned_to_jury restricted to own identity, admins, or service_role.
-- 8. UNVERIFIED COLUMNS: Does NOT assume public.project_domains has an is_active column.
-- 9. FK SAFETY: jury_domain_assignments uses ON DELETE RESTRICT on judge_user_id and domain_id.
-- 10. SELECTED DOMAIN INTEGRITY: Selected projects are defensively validated to match parent assignment domain.
-- =========================================================================

-- =========================================================================
-- 1. DOMAIN ALIASES TABLE
-- =========================================================================
-- Maps legacy/variant category strings to canonical project_domains.id
CREATE TABLE IF NOT EXISTS public.domain_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id TEXT NOT NULL REFERENCES public.project_domains(id) ON DELETE CASCADE,
    alias_text TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique constraint on trimmed alias text
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_aliases_normalized_unique
    ON public.domain_aliases (lower(trim(alias_text)));

CREATE INDEX IF NOT EXISTS idx_domain_aliases_domain_id
    ON public.domain_aliases (domain_id);

CREATE INDEX IF NOT EXISTS idx_domain_aliases_active
    ON public.domain_aliases (is_active);

-- Enable RLS
ALTER TABLE public.domain_aliases ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone authenticated or anonymous can read active aliases
DROP POLICY IF EXISTS "domain_aliases_read_policy" ON public.domain_aliases;
CREATE POLICY "domain_aliases_read_policy"
    ON public.domain_aliases
    FOR SELECT
    USING (is_active = TRUE OR (SELECT public.is_current_admin()));

-- HARDENING: Remove direct client write policy.
-- All mutations must go through FastAPI using backend service-role access.
DROP POLICY IF EXISTS "domain_aliases_admin_manage" ON public.domain_aliases;


-- =========================================================================
-- 2. JURY DOMAIN ASSIGNMENTS TABLE
-- =========================================================================
-- Represents Many-to-Many Dynamic Jury <-> Domain Assignment.
-- Uses ON DELETE RESTRICT to avoid silent cascade deletion of assignment history.
CREATE TABLE IF NOT EXISTS public.jury_domain_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_user_id UUID NOT NULL REFERENCES public.judges(user_id) ON DELETE RESTRICT,
    domain_id TEXT NOT NULL REFERENCES public.project_domains(id) ON DELETE RESTRICT,
    assignment_mode TEXT NOT NULL DEFAULT 'ALL' CHECK (assignment_mode IN ('ALL', 'SELECTED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_judge_domain_assignment UNIQUE (judge_user_id, domain_id)
);

-- Safe idempotent update to RESTRICT for existing installations
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'jury_domain_assignments_judge_user_id_fkey'
    ) THEN
        ALTER TABLE public.jury_domain_assignments 
            DROP CONSTRAINT jury_domain_assignments_judge_user_id_fkey,
            ADD CONSTRAINT jury_domain_assignments_judge_user_id_fkey 
                FOREIGN KEY (judge_user_id) REFERENCES public.judges(user_id) ON DELETE RESTRICT;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'jury_domain_assignments_domain_id_fkey'
    ) THEN
        ALTER TABLE public.jury_domain_assignments 
            DROP CONSTRAINT jury_domain_assignments_domain_id_fkey,
            ADD CONSTRAINT jury_domain_assignments_domain_id_fkey 
                FOREIGN KEY (domain_id) REFERENCES public.project_domains(id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jury_domain_assignments_judge
    ON public.jury_domain_assignments (judge_user_id);

CREATE INDEX IF NOT EXISTS idx_jury_domain_assignments_domain
    ON public.jury_domain_assignments (domain_id);

CREATE INDEX IF NOT EXISTS idx_jury_domain_assignments_active
    ON public.jury_domain_assignments (is_active);

CREATE INDEX IF NOT EXISTS idx_jury_domain_assignments_mode
    ON public.jury_domain_assignments (assignment_mode);

-- Enable RLS
ALTER TABLE public.jury_domain_assignments ENABLE ROW LEVEL SECURITY;

-- Jury can read only their own assignments; Admin can read all
DROP POLICY IF EXISTS "jury_domain_assignments_select" ON public.jury_domain_assignments;
CREATE POLICY "jury_domain_assignments_select"
    ON public.jury_domain_assignments
    FOR SELECT
    TO authenticated
    USING (
        judge_user_id = auth.uid()
        OR
        (SELECT public.is_current_admin())
    );

-- HARDENING: Remove direct client write policy.
-- All mutations must go through FastAPI using backend service-role access.
DROP POLICY IF EXISTS "jury_domain_assignments_admin_manage" ON public.jury_domain_assignments;


-- =========================================================================
-- 3. JURY PROJECT ASSIGNMENTS TABLE (SELECTED Mode)
-- =========================================================================
-- Explicit project-level assignments when assignment_mode = 'SELECTED'
CREATE TABLE IF NOT EXISTS public.jury_project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jury_domain_assignment_id UUID NOT NULL REFERENCES public.jury_domain_assignments(id) ON DELETE CASCADE,
    registration_id TEXT NOT NULL REFERENCES public.registrations(registration_id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_assignment_project UNIQUE (jury_domain_assignment_id, registration_id)
);

CREATE INDEX IF NOT EXISTS idx_jury_project_assignments_parent
    ON public.jury_project_assignments (jury_domain_assignment_id);

CREATE INDEX IF NOT EXISTS idx_jury_project_assignments_reg_id
    ON public.jury_project_assignments (registration_id);

-- Enable RLS
ALTER TABLE public.jury_project_assignments ENABLE ROW LEVEL SECURITY;

-- Jury can read project assignments linked to their domain assignment; Admin can read all
DROP POLICY IF EXISTS "jury_project_assignments_select" ON public.jury_project_assignments;
CREATE POLICY "jury_project_assignments_select"
    ON public.jury_project_assignments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.jury_domain_assignments jda
            WHERE jda.id = jury_domain_assignment_id
              AND jda.judge_user_id = auth.uid()
        )
        OR
        (SELECT public.is_current_admin())
    );

-- HARDENING: Remove direct client write policy.
-- All mutations must go through FastAPI using backend service-role access.
DROP POLICY IF EXISTS "jury_project_assignments_admin_manage" ON public.jury_project_assignments;

-- HARDENING: Selected Project Domain Integrity Trigger
-- Defensively validates that the selected project resolves to the parent assignment's domain.
CREATE OR REPLACE FUNCTION public.validate_jury_project_assignment_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_parent_domain_id TEXT;
    v_project_category TEXT;
    v_project_domain_id TEXT;
    v_clean_reg_id TEXT := upper(trim(NEW.registration_id));
BEGIN
    -- 1. Fetch parent assignment's domain_id
    SELECT domain_id INTO v_parent_domain_id
    FROM public.jury_domain_assignments
    WHERE id = NEW.jury_domain_assignment_id;

    IF v_parent_domain_id IS NULL THEN
        RAISE EXCEPTION 'Parent jury_domain_assignment with ID % does not exist.', NEW.jury_domain_assignment_id;
    END IF;

    -- 2. Resolve category from projects / registrations
    SELECT p.category INTO v_project_category
    FROM public.projects p
    JOIN public.registrations r ON r.id = p.registration_id
    WHERE upper(trim(r.registration_id)) = v_clean_reg_id
    LIMIT 1;

    IF v_project_category IS NULL THEN
        SELECT r.category INTO v_project_category
        FROM public.registrations r
        WHERE upper(trim(r.registration_id)) = v_clean_reg_id
        LIMIT 1;
    END IF;

    -- If category is found, verify it matches the parent domain
    IF v_project_category IS NOT NULL THEN
        SELECT da.domain_id INTO v_project_domain_id
        FROM public.domain_aliases da
        WHERE lower(trim(da.alias_text)) = lower(trim(v_project_category))
          AND da.is_active = TRUE
        LIMIT 1;

        IF v_project_domain_id IS NULL THEN
            SELECT pd.id INTO v_project_domain_id
            FROM public.project_domains pd
            WHERE lower(trim(pd.title)) = lower(trim(v_project_category))
               OR lower(trim(pd.id)) = lower(trim(v_project_category))
            LIMIT 1;
        END IF;

        IF v_project_domain_id IS NOT NULL AND v_project_domain_id <> v_parent_domain_id THEN
            RAISE EXCEPTION 'Selected project % belongs to domain %, but assignment is for domain %.',
                v_clean_reg_id, v_project_domain_id, v_parent_domain_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_jury_project_assignment_domain ON public.jury_project_assignments;
CREATE TRIGGER trg_validate_jury_project_assignment_domain
    BEFORE INSERT OR UPDATE ON public.jury_project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_jury_project_assignment_domain();


-- =========================================================================
-- 4. EVALUATION RESET AUDIT TABLE
-- =========================================================================
-- Immutable audit record populated before any evaluation is reset/deleted.
-- Strictly no direct authenticated INSERT, UPDATE, or DELETE permitted.
CREATE TABLE IF NOT EXISTS public.evaluation_reset_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL,
    judge_id UUID NOT NULL,
    judge_name TEXT,
    judge_email TEXT,
    registration_id TEXT NOT NULL,
    scores_snapshot JSONB NOT NULL,
    total_score NUMERIC NOT NULL,
    reset_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reset_reason TEXT NOT NULL,
    reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_reset_audit_reg_id
    ON public.evaluation_reset_audit (registration_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_reset_audit_judge_id
    ON public.evaluation_reset_audit (judge_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_reset_audit_reset_at
    ON public.evaluation_reset_audit (reset_at DESC);

-- Enable RLS
ALTER TABLE public.evaluation_reset_audit ENABLE ROW LEVEL SECURITY;

-- Read policy: Admins only
DROP POLICY IF EXISTS "evaluation_reset_audit_admin_select" ON public.evaluation_reset_audit;
CREATE POLICY "evaluation_reset_audit_admin_select"
    ON public.evaluation_reset_audit
    FOR SELECT
    TO authenticated
    USING ((SELECT public.is_current_admin()));

-- HARDENING: Remove direct client insert policy.
-- Audit rows cannot be created, modified, or deleted by any browser session.
-- Only public.atomic_reset_evaluation, invoked through backend service_role, may create audit rows.
DROP POLICY IF EXISTS "evaluation_reset_audit_admin_insert" ON public.evaluation_reset_audit;


-- =========================================================================
-- 5. ATOMIC EVALUATION RESET POSTGRES RPC
-- =========================================================================
-- Atomically snapshots the evaluation row to audit and deletes the record
-- in a single ACID transaction.
CREATE OR REPLACE FUNCTION public.atomic_reset_evaluation(
    p_evaluation_id UUID,
    p_admin_user_id UUID,
    p_reset_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_eval RECORD;
    v_audit_id UUID;
BEGIN
    -- Validate reason is supplied
    IF p_reset_reason IS NULL OR trim(p_reset_reason) = '' THEN
        RAISE EXCEPTION 'A mandatory reset reason is required to reset an evaluation.';
    END IF;

    -- 1. Fetch the target evaluation row with row-level lock
    SELECT * INTO v_eval
    FROM public.judge_evaluations
    WHERE id = p_evaluation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evaluation with ID % was not found.', p_evaluation_id;
    END IF;

    -- 2. Insert complete snapshot into evaluation_reset_audit
    INSERT INTO public.evaluation_reset_audit (
        id,
        evaluation_id,
        judge_id,
        judge_name,
        judge_email,
        registration_id,
        scores_snapshot,
        total_score,
        reset_by,
        reset_reason,
        reset_at
    ) VALUES (
        gen_random_uuid(),
        v_eval.id,
        v_eval.judge_id,
        v_eval.judge_name,
        v_eval.judge_email,
        v_eval.registration_id,
        coalesce(v_eval.criteria_scores, '{}'::jsonb),
        v_eval.total_score,
        p_admin_user_id,
        trim(p_reset_reason),
        NOW()
    )
    RETURNING id INTO v_audit_id;

    -- 3. Delete ONLY that evaluation row
    DELETE FROM public.judge_evaluations
    WHERE id = p_evaluation_id;

    -- 4. Return success metadata
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Evaluation successfully reset and logged to audit trail.',
        'deleted_id', p_evaluation_id,
        'audit_id', v_audit_id,
        'judge_id', v_eval.judge_id,
        'registration_id', v_eval.registration_id
    );
END;
$$;

-- Secure execution permissions: Revoke from all public / regular authenticated users.
-- Only the privileged backend (service_role) may invoke this atomic reset procedure.
REVOKE ALL ON FUNCTION public.atomic_reset_evaluation(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.atomic_reset_evaluation(UUID, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.atomic_reset_evaluation(UUID, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_reset_evaluation(UUID, UUID, TEXT) TO service_role;


-- =========================================================================
-- 6. HELPER FUNCTION: is_project_assigned_to_jury (HARDENED)
-- =========================================================================
-- Evaluates whether a project is currently assigned to a jury member,
-- checking ALL mode and SELECTED mode assignments dynamically.
--
-- Security Hardening:
-- Prevents ordinary authenticated users from probing arbitrary jury assignments.
-- Execution allowed ONLY when:
-- A. p_jury_user_id = auth.uid() (Jury checking own assignment / Stage B RLS)
-- OR
-- B. Caller is an authorized current admin
-- OR
-- C. JWT database role is service_role
-- Otherwise returns FALSE.
CREATE OR REPLACE FUNCTION public.is_project_assigned_to_jury(
    p_jury_user_id UUID,
    p_registration_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_reg_id TEXT := upper(trim(p_registration_id));
    v_category TEXT;
    v_domain_id TEXT;
    v_is_assigned BOOLEAN := FALSE;
BEGIN
    IF p_jury_user_id IS NULL OR v_clean_reg_id IS NULL OR v_clean_reg_id = '' THEN
        RETURN FALSE;
    END IF;

    -- Authorization Guard: Caller can check their own assignments,
    -- or must be an admin, or the service_role backend.
    IF NOT (
        (auth.uid() IS NOT NULL AND auth.uid() = p_jury_user_id)
        OR (SELECT public.is_current_admin())
        OR (current_user = 'service_role')
        OR (coalesce(auth.jwt() ->> 'role', '') = 'service_role')
    ) THEN
        RETURN FALSE;
    END IF;

    -- 1. Find category of target project from projects table
    SELECT p.category INTO v_category
    FROM public.projects p
    JOIN public.registrations r ON r.id = p.registration_id
    WHERE upper(trim(r.registration_id)) = v_clean_reg_id
    LIMIT 1;

    -- Fallback: check registrations table directly
    IF v_category IS NULL THEN
        SELECT r.category INTO v_category
        FROM public.registrations r
        WHERE upper(trim(r.registration_id)) = v_clean_reg_id
        LIMIT 1;
    END IF;

    IF v_category IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 2. Resolve domain_id from domain_aliases
    SELECT da.domain_id INTO v_domain_id
    FROM public.domain_aliases da
    WHERE lower(trim(da.alias_text)) = lower(trim(v_category))
      AND da.is_active = TRUE
    LIMIT 1;

    -- Fallback: exact match on project_domains.title or project_domains.id
    -- Note: Safely does NOT assume an is_active column exists on project_domains.
    IF v_domain_id IS NULL THEN
        SELECT pd.id INTO v_domain_id
        FROM public.project_domains pd
        WHERE lower(trim(pd.title)) = lower(trim(v_category))
           OR lower(trim(pd.id)) = lower(trim(v_category))
        LIMIT 1;
    END IF;

    -- 3. Check for active 'ALL' mode assignment covering this domain
    IF v_domain_id IS NOT NULL THEN
        SELECT TRUE INTO v_is_assigned
        FROM public.jury_domain_assignments jda
        JOIN public.judges j ON j.user_id = jda.judge_user_id
        WHERE jda.judge_user_id = p_jury_user_id
          AND jda.domain_id = v_domain_id
          AND jda.assignment_mode = 'ALL'
          AND jda.is_active = TRUE
          AND j.is_active = TRUE
        LIMIT 1;

        IF v_is_assigned IS TRUE THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- 4. Check for active 'SELECTED' mode assignment covering this registration_id
    SELECT TRUE INTO v_is_assigned
    FROM public.jury_project_assignments jpa
    JOIN public.jury_domain_assignments jda ON jda.id = jpa.jury_domain_assignment_id
    JOIN public.judges j ON j.user_id = jda.judge_user_id
    WHERE jda.judge_user_id = p_jury_user_id
      AND upper(trim(jpa.registration_id)) = v_clean_reg_id
      AND jda.assignment_mode = 'SELECTED'
      AND jda.is_active = TRUE
      AND j.is_active = TRUE
    LIMIT 1;

    RETURN coalesce(v_is_assigned, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_project_assigned_to_jury(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_assigned_to_jury(UUID, TEXT) TO service_role;


-- =========================================================================
-- 7. SEED CANONICAL DOMAIN ALIASES (SAFE, ADDITIVE, ASCII-SAFE UNICODE)
-- =========================================================================
-- Maps known production categories to domain IDs.
-- Uses ASCII-safe PostgreSQL Unicode escapes for EN DASH U+2013 (\+002013 and \2013).
-- Uses ON CONFLICT DO NOTHING so it is completely safe to run multiple times.

DO $$
BEGIN
    -- Mismatch Case A: Multidisciplinary Innovation
    IF EXISTS (SELECT 1 FROM public.project_domains WHERE id = 'domain-c0677a05') THEN
        INSERT INTO public.domain_aliases (domain_id, alias_text)
        VALUES 
            ('domain-c0677a05', 'Multidisciplinary Innovation & Smart Solution'),
            ('domain-c0677a05', 'Multidisciplinary Innovation & Smart Solutions')
        ON CONFLICT (lower(trim(alias_text))) DO NOTHING;
    END IF;

    -- Mismatch Case B: School Innovation (Using ASCII-safe Unicode escape for EN DASH U+2013)
    IF EXISTS (SELECT 1 FROM public.project_domains WHERE id = 'domain-9f52a525') THEN
        INSERT INTO public.domain_aliases (domain_id, alias_text)
        VALUES 
            ('domain-9f52a525', U&'School Innovation & Young Innovators (For 8th\+00201312th Standard Students)'),
            ('domain-9f52a525', 'School Innovation & Young Innovators (For 8th-12th Standard Students)'),
            ('domain-9f52a525', 'School Innovation & Young Innovators')
        ON CONFLICT (lower(trim(alias_text))) DO NOTHING;
    END IF;

    -- Auto-seed each existing project_domains record with its own title
    INSERT INTO public.domain_aliases (domain_id, alias_text)
    SELECT id, title
    FROM public.project_domains
    WHERE title IS NOT NULL AND trim(title) <> ''
    ON CONFLICT (lower(trim(alias_text))) DO NOTHING;
END $$;

-- Migration Assertion: Verify long School Innovation alias resolves to domain-9f52a525.
-- Uses NULL-safe IS DISTINCT FROM to ensure missing/NULL alias fails loudly.
DO $$
DECLARE
    v_resolved TEXT;
BEGIN
    SELECT domain_id INTO v_resolved
    FROM public.domain_aliases
    WHERE lower(trim(alias_text)) = lower(trim(U&'School Innovation & Young Innovators (For 8th\+00201312th Standard Students)'))
    LIMIT 1;

    IF v_resolved IS DISTINCT FROM 'domain-9f52a525' THEN
        RAISE EXCEPTION 'Assertion failed: School Innovation long alias resolved to % instead of domain-9f52a525', coalesce(v_resolved, 'NULL');
    END IF;
END $$;


-- =========================================================================
-- STAGE B: CUTOVER PRE-FLIGHT VALIDATION & ENFORCEMENT (DOCUMENTATION ONLY)
-- =========================================================================
-- DO NOT EXECUTE STAGE B UNTIL ALL JURIES ARE CONFIGURED BY ADMIN!
--
-- A. PREFLIGHT ORPHAN EVALUATION QUERY:
--    Run this read-only query to find any existing evaluations submitted
--    without a corresponding jury domain or project assignment:
--
--    SELECT 
--        e.id AS evaluation_id,
--        e.judge_id,
--        e.judge_name,
--        e.judge_email,
--        e.registration_id,
--        e.project_title,
--        e.category,
--        e.total_score
--    FROM public.judge_evaluations e
--    WHERE NOT public.is_project_assigned_to_jury(e.judge_id, e.registration_id);
--
-- B. ASSIGNMENT-AWARE INSERT POLICY:
--    Once zero orphan evaluations exist, activate this strict insert policy:
--
--    DROP POLICY IF EXISTS "jury_insert_own_evaluations" ON public.judge_evaluations;
--    CREATE POLICY "jury_insert_own_evaluations"
--    ON public.judge_evaluations
--    FOR INSERT
--    TO authenticated
--    WITH CHECK (
--        judge_id = auth.uid()
--        AND
--        public.is_current_jury()
--        AND
--        public.is_project_assigned_to_jury(auth.uid(), registration_id)
--    );
--
-- C. SUBMITTED EVALUATION IMMUTABILITY (NO DIRECT CLIENT UPDATES):
--    Submitted evaluations are strictly immutable.
--    Neither Jury browser nor Admin browser may directly update evaluation rows.
--    Drop existing authenticated update policy and create NO replacement.
--    Correction workflow is exclusively: Admin Reset Evaluation (atomic audit + delete via service_role)
--    -> Jury submits a fresh evaluation.
--
--    DROP POLICY IF EXISTS "jury_update_own_or_admin_update" ON public.judge_evaluations;
--
-- D. ENSURE JURY DELETE REMAINS IMPOSSIBLE &
-- E. ENSURE ADMIN BROWSER CANNOT DIRECTLY DELETE EVALUATIONS AND BYPASS AUDIT:
--    Remove direct DELETE policy for authenticated clients on judge_evaluations.
--    Neither Jury nor Admin browser sessions may directly delete evaluation records.
--    All deletions MUST go through the backend service-role atomic_reset_evaluation RPC.
--
--    DROP POLICY IF EXISTS "admin_delete_evaluations" ON public.judge_evaluations;
-- =========================================================================

