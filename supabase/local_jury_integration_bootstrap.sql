-- =========================================================================
-- PRAGATHI 2K26 — LOCAL JURY INTEGRATION BOOTSTRAP SCHEMA
-- =========================================================================
-- Purpose: Minimal local PostgreSQL bootstrap matching LIVE Supabase schema
-- for executing and validating jury_exclusive_assignment_migration.sql.
--
-- Target Database: Local PostgreSQL (e.g., pragathi_test on localhost:5432)
-- NOTE: Does NOT require Supabase auth schema or auth roles.
-- =========================================================================

-- Enable required extensions
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROJECT DOMAINS TABLE (LIVE TYPE: id = TEXT)
CREATE TABLE IF NOT EXISTS public.project_domains (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon_name TEXT DEFAULT 'Cpu',
    color TEXT DEFAULT 'from-blue-600 to-indigo-600',
    badge_text TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DOMAIN ALIASES TABLE (domain_id = TEXT -> project_domains.id)
CREATE TABLE IF NOT EXISTS public.domain_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id TEXT NOT NULL REFERENCES public.project_domains(id) ON DELETE CASCADE,
    alias_text TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_aliases_normalized_unique
    ON public.domain_aliases (lower(trim(alias_text)));

-- 3. REGISTRATIONS TABLE (PK: id UUID, Natural Unique Key: registration_id TEXT)
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id TEXT UNIQUE NOT NULL,
    participant_type TEXT DEFAULT 'sru_student',
    team_name TEXT DEFAULT 'Test Team',
    team_size INT DEFAULT 1,
    leader_name TEXT DEFAULT 'Team Leader',
    leader_email TEXT DEFAULT 'leader@example.com',
    leader_mobile TEXT DEFAULT '9999999999',
    registration_status TEXT DEFAULT 'submitted',
    payment_status TEXT DEFAULT 'paid',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROJECTS TABLE (FK: registration_id UUID -> registrations.id)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    problem_statement TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. JUDGES TABLE (Profile & Judge User Mapping)
CREATE TABLE IF NOT EXISTS public.judges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. JURY DOMAIN ASSIGNMENTS TABLE (domain_id TEXT, judge_user_id UUID)
CREATE TABLE IF NOT EXISTS public.jury_domain_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_user_id UUID NOT NULL REFERENCES public.judges(user_id) ON DELETE RESTRICT,
    domain_id TEXT NOT NULL REFERENCES public.project_domains(id) ON DELETE RESTRICT,
    assignment_mode TEXT NOT NULL DEFAULT 'ALL' CHECK (assignment_mode IN ('ALL', 'SELECTED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_judge_domain_assignment UNIQUE (judge_user_id, domain_id)
);

-- 7. JURY PROJECT ASSIGNMENTS TABLE (registration_id TEXT -> registrations.registration_id)
CREATE TABLE IF NOT EXISTS public.jury_project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jury_domain_assignment_id UUID NOT NULL REFERENCES public.jury_domain_assignments(id) ON DELETE CASCADE,
    registration_id TEXT NOT NULL REFERENCES public.registrations(registration_id) ON DELETE CASCADE,
    assigned_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_assignment_project UNIQUE (jury_domain_assignment_id, registration_id)
);

-- 8. JUDGE EVALUATIONS TABLE (Optional evaluation tracking)
CREATE TABLE IF NOT EXISTS public.judge_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_id UUID,
    judge_email TEXT NOT NULL,
    judge_name TEXT NOT NULL,
    registration_id TEXT NOT NULL REFERENCES public.registrations(registration_id) ON DELETE CASCADE,
    team_name TEXT DEFAULT '',
    project_title TEXT DEFAULT '',
    category TEXT DEFAULT '',
    total_score NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SEED BASELINE CANONICAL DOMAINS & ALIASES
INSERT INTO public.project_domains (id, title, is_active, display_order)
VALUES 
    ('ai-software', 'Artificial Intelligence & Software Engineering', TRUE, 1),
    ('domain-c0677a05', 'Civil Engineering & Smart Infrastructure', TRUE, 2),
    ('domain-9f52a525', 'Mechanical & Robotics Engineering', TRUE, 3)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    is_active = EXCLUDED.is_active;

INSERT INTO public.domain_aliases (domain_id, alias_text, is_active)
VALUES
    ('ai-software', 'Artificial Intelligence & Software Engineering', TRUE),
    ('ai-software', 'AI & Software', TRUE),
    ('ai-software', 'ai-software', TRUE),
    ('ai-software', 'Civil Engineering & Smart Infrastructure', TRUE),
    ('ai-software', 'Civil Engineering', TRUE),
    ('ai-software', 'smart-infra', TRUE),
    ('domain-9f52a525', 'Mechanical & Robotics Engineering', TRUE),
    ('domain-9f52a525', 'Mechanical Engineering', TRUE),
    ('domain-9f52a525', 'Robotics', TRUE)
ON CONFLICT (lower(trim(alias_text))) DO NOTHING;
