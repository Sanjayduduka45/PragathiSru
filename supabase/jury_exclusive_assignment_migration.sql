-- =========================================================================
-- PRAGATHI 2K26 — JURY EXCLUSIVE PROJECT ASSIGNMENT MIGRATION
-- =========================================================================
-- FINAL BUSINESS RULE: ONE PROJECT CAN HAVE ONLY ONE ACTIVE JURY MEMBER.
-- Multiple juries may belong to the same domain, but projects inside
-- that domain are partitioned between them with zero overlap.
--
-- NOTE: DO NOT EXECUTE THIS SCRIPT AUTOMATICALLY.
-- This file is provided for manual review and staging execution by the DBA.
--
-- -------------------------------------------------------------------------
-- A. LIVE PRODUCTION SCHEMA ANALYSIS & VERIFICATION
-- -------------------------------------------------------------------------
-- Verified against live production schema and past migrations:
-- 1. public.jury_domain_assignments:
--    - Primary Key: id UUID DEFAULT gen_random_uuid()
--    - judge_user_id UUID NOT NULL REFERENCES public.judges(user_id)
--    - domain_id TEXT NOT NULL REFERENCES public.project_domains(id)
--    - assignment_mode TEXT NOT NULL DEFAULT 'ALL' CHECK (assignment_mode IN ('ALL', 'SELECTED'))
--    - is_active BOOLEAN NOT NULL DEFAULT TRUE
--    - assigned_by UUID REFERENCES auth.users(id)
--    - created_at, updated_at TIMESTAMPTZ
--    - Existing Constraint: unique_judge_domain_assignment UNIQUE (judge_user_id, domain_id)
--
-- 2. public.jury_project_assignments:
--    - Primary Key: id UUID DEFAULT gen_random_uuid()
--    - Foreign Key connecting to jury_domain_assignments:
--        jury_domain_assignment_id UUID NOT NULL REFERENCES public.jury_domain_assignments(id) ON DELETE CASCADE
--    - Foreign Key connecting to registrations:
--        registration_id TEXT NOT NULL REFERENCES public.registrations(registration_id) ON DELETE CASCADE
--    - assigned_by UUID REFERENCES auth.users(id)
--    - created_at TIMESTAMPTZ
--    - Column 'is_active' DOES NOT EXIST on this table (assignments are removed by DELETE).
--    - Existing Constraint: unique_assignment_project UNIQUE (jury_domain_assignment_id, registration_id)
--
-- 3. public.registrations:
--    - Primary Key: id UUID DEFAULT gen_random_uuid()
--    - Natural Unique Key: registration_id TEXT UNIQUE NOT NULL (Format: PRAGATHI26-XXXXXX)
--    - Does NOT contain category column.
--
-- 4. public.projects:
--    - Primary Key: id UUID DEFAULT gen_random_uuid()
--    - Foreign Key: registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE
--    - Authoritative source of category: category TEXT NOT NULL
--    - title TEXT NOT NULL
--
-- -------------------------------------------------------------------------
-- B. READ-ONLY PREFLIGHT QUERIES (RUN BEFORE APPLYING MIGRATION)
-- -------------------------------------------------------------------------
-- All queries are strictly READ-ONLY for DBA preflight inspection.
-- Expected result in clean production: ZERO rows returned across all checks.
--
-- PREFLIGHT CHECK 1: Duplicate explicit project ownership
-- SELECT 
--     jpa.registration_id, 
--     COUNT(DISTINCT jda.judge_user_id) AS active_jury_count,
--     ARRAY_AGG(DISTINCT jda.judge_user_id) AS assigned_judges
-- FROM public.jury_project_assignments jpa
-- JOIN public.jury_domain_assignments jda ON jda.id = jpa.jury_domain_assignment_id
-- WHERE jda.is_active = TRUE
-- GROUP BY jpa.registration_id
-- HAVING COUNT(DISTINCT jda.judge_user_id) > 1;
--
-- PREFLIGHT CHECK 2: Duplicate active ALL domain ownership
-- SELECT 
--     jda.domain_id,
--     COUNT(DISTINCT jda.judge_user_id) AS active_all_jury_count,
--     ARRAY_AGG(DISTINCT jda.judge_user_id) AS all_mode_judges
-- FROM public.jury_domain_assignments jda
-- WHERE jda.is_active = TRUE AND jda.assignment_mode = 'ALL'
-- GROUP BY jda.domain_id
-- HAVING COUNT(DISTINCT jda.judge_user_id) > 1;
--
-- PREFLIGHT CHECK 3: CROSS-MODE conflicts (ALL-mode domain vs active SELECTED projects)
-- SELECT 
--     jda_all.domain_id,
--     jda_all.judge_user_id AS all_jury_user_id,
--     jda_sel.judge_user_id AS selected_jury_user_id,
--     jpa.registration_id
-- FROM public.jury_domain_assignments jda_all
-- JOIN public.jury_domain_assignments jda_sel 
--     ON jda_sel.domain_id = jda_all.domain_id 
--     AND jda_sel.judge_user_id != jda_all.judge_user_id
--     AND jda_sel.is_active = TRUE
-- JOIN public.jury_project_assignments jpa 
--     ON jpa.jury_domain_assignment_id = jda_sel.id
-- WHERE jda_all.is_active = TRUE 
--   AND jda_all.assignment_mode = 'ALL';


-- -------------------------------------------------------------------------
-- C. PRODUCTION TRANSACTION MIGRATION (FOR MANUAL DBA EXECUTION ONLY)
-- -------------------------------------------------------------------------

BEGIN;

-- STEP 1: Assert Preconditions (Aborts entire transaction if conflicts exist)
DO $$
DECLARE
    v_dup_proj INT;
    v_dup_all INT;
    v_cross_conf INT;
BEGIN
    -- Precondition 1
    SELECT COUNT(*) INTO v_dup_proj FROM (
        SELECT jpa.registration_id
        FROM public.jury_project_assignments jpa
        JOIN public.jury_domain_assignments jda ON jda.id = jpa.jury_domain_assignment_id
        WHERE jda.is_active = TRUE
        GROUP BY jpa.registration_id
        HAVING COUNT(DISTINCT jda.judge_user_id) > 1
    ) sub;
    IF v_dup_proj > 0 THEN
        RAISE EXCEPTION 'PRECONDITION FAILED: Found % active duplicate project assignments. Resolve before applying migration.', v_dup_proj;
    END IF;

    -- Precondition 2
    SELECT COUNT(*) INTO v_dup_all FROM (
        SELECT domain_id
        FROM public.jury_domain_assignments
        WHERE is_active = TRUE AND assignment_mode = 'ALL'
        GROUP BY domain_id
        HAVING COUNT(DISTINCT judge_user_id) > 1
    ) sub;
    IF v_dup_all > 0 THEN
        RAISE EXCEPTION 'PRECONDITION FAILED: Found % duplicate active ALL-mode domain assignments. Resolve before applying migration.', v_dup_all;
    END IF;

    -- Precondition 3
    SELECT COUNT(*) INTO v_cross_conf FROM (
        SELECT jpa.registration_id
        FROM public.jury_domain_assignments jda_all
        JOIN public.jury_domain_assignments jda_sel 
            ON jda_sel.domain_id = jda_all.domain_id 
            AND jda_sel.judge_user_id != jda_all.judge_user_id
            AND jda_sel.is_active = TRUE
        JOIN public.jury_project_assignments jpa 
            ON jpa.jury_domain_assignment_id = jda_sel.id
        WHERE jda_all.is_active = TRUE 
          AND jda_all.assignment_mode = 'ALL'
    ) sub;
    IF v_cross_conf > 0 THEN
        RAISE EXCEPTION 'PRECONDITION FAILED: Found % cross-mode active assignment conflicts. Resolve before applying migration.', v_cross_conf;
    END IF;
END $$;

-- STEP 2: Unique Index — At most ONE active 'ALL' mode jury per canonical domain
CREATE UNIQUE INDEX IF NOT EXISTS idx_jury_domain_single_active_all
    ON public.jury_domain_assignments (domain_id)
    WHERE is_active = TRUE AND assignment_mode = 'ALL';

-- STEP 3: Unique Index — At most ONE active jury assignment per registration_id
-- In jury_project_assignments, every row is an active assignment.
CREATE UNIQUE INDEX IF NOT EXISTS idx_jury_project_assignments_unique_reg
    ON public.jury_project_assignments (registration_id);

-- STEP 4: Trigger Function — Project Assignment Cross-Mode Exclusivity & Category Validation
CREATE OR REPLACE FUNCTION public.check_project_exclusive_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_domain TEXT;
    v_current_judge UUID;
    v_existing_all_judge UUID;
    v_project_category TEXT;
    v_project_domain_id TEXT;
    v_clean_reg_id TEXT := upper(trim(NEW.registration_id));
BEGIN
    -- 1. Resolve parent jury_domain_assignment
    SELECT judge_user_id, domain_id 
    INTO v_current_judge, v_target_domain
    FROM public.jury_domain_assignments
    WHERE id = NEW.jury_domain_assignment_id;

    IF v_target_domain IS NULL THEN
        RAISE EXCEPTION 'Parent jury_domain_assignment with ID % does not exist.', NEW.jury_domain_assignment_id;
    END IF;

    -- 2. Reject if another active judge owns this domain in ALL mode
    SELECT judge_user_id INTO v_existing_all_judge
    FROM public.jury_domain_assignments
    WHERE domain_id = v_target_domain
      AND is_active = TRUE
      AND assignment_mode = 'ALL'
      AND judge_user_id != v_current_judge
    LIMIT 1;

    IF v_existing_all_judge IS NOT NULL THEN
        RAISE EXCEPTION 'Project % is already assigned to another jury member.', v_clean_reg_id
            USING ERRCODE = '23505';
    END IF;

    -- 3. Validate project belongs to parent canonical domain via projects table
    SELECT p.category INTO v_project_category
    FROM public.projects p
    JOIN public.registrations r ON r.id = p.registration_id
    WHERE upper(trim(r.registration_id)) = v_clean_reg_id
    LIMIT 1;

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

        IF v_project_domain_id IS NOT NULL AND v_project_domain_id <> v_target_domain THEN
            RAISE EXCEPTION 'Selected project % belongs to domain %, but assignment is for domain %.',
                v_clean_reg_id, v_project_domain_id, v_target_domain;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_project_exclusive_assignment ON public.jury_project_assignments;
CREATE TRIGGER trg_check_project_exclusive_assignment
    BEFORE INSERT OR UPDATE ON public.jury_project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_project_exclusive_assignment();

-- STEP 5: Trigger Function — Domain Assignment ALL-Mode Guard
CREATE OR REPLACE FUNCTION public.check_domain_all_exclusive_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_conflicting_project TEXT;
BEGIN
    IF NEW.is_active = TRUE AND NEW.assignment_mode = 'ALL' THEN
        SELECT jpa.registration_id INTO v_conflicting_project
        FROM public.jury_project_assignments jpa
        JOIN public.jury_domain_assignments jda ON jda.id = jpa.jury_domain_assignment_id
        WHERE jda.domain_id = NEW.domain_id
          AND jda.judge_user_id != NEW.judge_user_id
          AND jda.is_active = TRUE
        LIMIT 1;

        IF v_conflicting_project IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot set ALL mode for domain %: Project % is already assigned to another jury member.',
                NEW.domain_id, v_conflicting_project
                USING ERRCODE = '23505';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_domain_all_exclusive_assignment ON public.jury_domain_assignments;
CREATE TRIGGER trg_check_domain_all_exclusive_assignment
    BEFORE INSERT OR UPDATE ON public.jury_domain_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_domain_all_exclusive_assignment();

-- STEP 6: Authoritative RPC Function — assign_jury_domain_exclusive
-- Uses deterministic transaction advisory lock to serialize domain assignment mutations
CREATE OR REPLACE FUNCTION public.assign_jury_domain_exclusive(
    p_judge_user_id UUID,
    p_domain_id TEXT,
    p_assignment_mode TEXT,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_mode TEXT := upper(trim(p_assignment_mode));
    v_clean_dom_id TEXT := trim(p_domain_id);
    v_other_all_judge UUID;
    v_conflicting_project TEXT;
    v_result RECORD;
BEGIN
    -- 1. Deterministic Transaction Advisory Lock on canonical domain_id
    PERFORM pg_advisory_xact_lock(hashtext(v_clean_dom_id));

    -- 2. Verify domain exists
    IF NOT EXISTS (SELECT 1 FROM public.project_domains WHERE id = v_clean_dom_id) THEN
        RAISE EXCEPTION 'Domain % does not exist.', v_clean_dom_id
            USING ERRCODE = 'P0002';
    END IF;

    -- 3. Check if another active judge already owns this domain in ALL mode
    SELECT judge_user_id INTO v_other_all_judge
    FROM public.jury_domain_assignments
    WHERE domain_id = v_clean_dom_id
      AND is_active = TRUE
      AND assignment_mode = 'ALL'
      AND judge_user_id != p_judge_user_id
    LIMIT 1;

    IF v_other_all_judge IS NOT NULL THEN
        RAISE EXCEPTION 'Domain % is already assigned to another jury member in ALL mode.', v_clean_dom_id
            USING ERRCODE = '23505';
    END IF;

    -- 4. If attempting ALL mode: check if another judge has active SELECTED projects in this domain
    IF v_clean_mode = 'ALL' THEN
        SELECT jpa.registration_id INTO v_conflicting_project
        FROM public.jury_project_assignments jpa
        JOIN public.jury_domain_assignments jda ON jda.id = jpa.jury_domain_assignment_id
        WHERE jda.domain_id = v_clean_dom_id
          AND jda.judge_user_id != p_judge_user_id
          AND jda.is_active = TRUE
        LIMIT 1;

        IF v_conflicting_project IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot set ALL mode for domain %: Project % is already assigned to another jury member.',
                v_clean_dom_id, v_conflicting_project
                USING ERRCODE = '23505';
        END IF;
    END IF;

    -- 5. Upsert into public.jury_domain_assignments
    INSERT INTO public.jury_domain_assignments (
        judge_user_id,
        domain_id,
        assignment_mode,
        is_active,
        assigned_by,
        updated_at
    )
    VALUES (
        p_judge_user_id,
        v_clean_dom_id,
        v_clean_mode,
        TRUE,
        p_assigned_by,
        NOW()
    )
    ON CONFLICT (judge_user_id, domain_id)
    DO UPDATE SET
        assignment_mode = EXCLUDED.assignment_mode,
        is_active = TRUE,
        assigned_by = COALESCE(EXCLUDED.assigned_by, public.jury_domain_assignments.assigned_by),
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN to_jsonb(v_result);
END;
$$;

-- STEP 7: Authoritative RPC Function — add_jury_selected_projects_exclusive
-- Uses deterministic transaction advisory lock on parent domain to serialize project assignments
CREATE OR REPLACE FUNCTION public.add_jury_selected_projects_exclusive(
    p_assignment_id UUID,
    p_registration_ids TEXT[],
    p_assigned_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_domain TEXT;
    v_current_judge UUID;
    v_other_all_judge UUID;
    v_rid TEXT;
    v_clean_rid TEXT;
    v_existing_owner UUID;
    v_proj_cat TEXT;
    v_proj_dom TEXT;
    v_added_count INT := 0;
BEGIN
    -- 1. Fetch parent assignment
    SELECT judge_user_id, domain_id INTO v_current_judge, v_target_domain
    FROM public.jury_domain_assignments
    WHERE id = p_assignment_id;

    IF v_target_domain IS NULL THEN
        RAISE EXCEPTION 'Jury domain assignment % not found.', p_assignment_id
            USING ERRCODE = 'P0002';
    END IF;

    -- 2. Deterministic Transaction Advisory Lock on parent domain_id
    PERFORM pg_advisory_xact_lock(hashtext(v_target_domain));

    -- 3. Check if another active judge owns this domain in ALL mode
    SELECT judge_user_id INTO v_other_all_judge
    FROM public.jury_domain_assignments
    WHERE domain_id = v_target_domain
      AND is_active = TRUE
      AND assignment_mode = 'ALL'
      AND judge_user_id != v_current_judge
    LIMIT 1;

    IF v_other_all_judge IS NOT NULL THEN
        RAISE EXCEPTION 'Domain % is already assigned to another jury member in ALL mode.', v_target_domain
            USING ERRCODE = '23505';
    END IF;

    -- 4. Loop through registration IDs
    FOREACH v_rid IN ARRAY p_registration_ids
    LOOP
        v_clean_rid := upper(trim(v_rid));
        IF v_clean_rid = '' THEN
            CONTINUE;
        END IF;

        -- Check if already assigned to another judge
        SELECT jda.judge_user_id INTO v_existing_owner
        FROM public.jury_project_assignments jpa
        JOIN public.jury_domain_assignments jda ON jda.id = jpa.jury_domain_assignment_id
        WHERE upper(trim(jpa.registration_id)) = v_clean_rid
          AND jda.is_active = TRUE
        LIMIT 1;

        IF v_existing_owner IS NOT NULL AND v_existing_owner != v_current_judge THEN
            RAISE EXCEPTION 'Project % is already assigned to another jury member.', v_clean_rid
                USING ERRCODE = '23505';
        END IF;

        -- Validate canonical domain match via projects
        SELECT p.category INTO v_proj_cat
        FROM public.projects p
        JOIN public.registrations r ON r.id = p.registration_id
        WHERE upper(trim(r.registration_id)) = v_clean_rid
        LIMIT 1;

        IF v_proj_cat IS NOT NULL THEN
            SELECT da.domain_id INTO v_proj_dom
            FROM public.domain_aliases da
            WHERE lower(trim(da.alias_text)) = lower(trim(v_proj_cat))
              AND da.is_active = TRUE
            LIMIT 1;

            IF v_proj_dom IS NULL THEN
                SELECT pd.id INTO v_proj_dom
                FROM public.project_domains pd
                WHERE lower(trim(pd.title)) = lower(trim(v_proj_cat))
                   OR lower(trim(pd.id)) = lower(trim(v_proj_cat))
                LIMIT 1;
            END IF;

            IF v_proj_dom IS NOT NULL AND v_proj_dom <> v_target_domain THEN
                RAISE EXCEPTION 'Selected project % belongs to domain %, which does not match parent assignment domain %.',
                    v_clean_rid, v_proj_dom, v_target_domain
                    USING ERRCODE = '22000';
            END IF;
        END IF;

        -- Insert row into jury_project_assignments
        INSERT INTO public.jury_project_assignments (
            jury_domain_assignment_id,
            registration_id,
            assigned_by
        )
        VALUES (
            p_assignment_id,
            v_clean_rid,
            p_assigned_by
        )
        ON CONFLICT (jury_domain_assignment_id, registration_id) DO NOTHING;

        v_added_count := v_added_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', TRUE, 'added_count', v_added_count);
END;
$$;

COMMIT;
