-- PRAGATHI 2K26 — Judge Management & Project Evaluation Migration
-- Run this in your Supabase SQL Editor.

-- =========================================================
-- 1. UPDATE USER_ROLES CHECK CONSTRAINT
-- =========================================================
-- Ensure 'judge' and 'jury' are valid roles in public.user_roles

ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('admin', 'superadmin', 'coordinator', 'jury', 'judge', 'participant'));

-- =========================================================
-- 2. EVALUATION CRITERIA CONFIGURATION TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  max_score INT NOT NULL DEFAULT 20,
  weight NUMERIC DEFAULT 1.0,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default criteria (Innovation, Technical Execution, Problem Relevance, Presentation, Impact)
INSERT INTO public.evaluation_criteria (key, label, description, max_score, display_order)
VALUES
  ('innovation', 'Innovation & Novelty', 'Originality of the concept, creativity of the approach and uniqueness', 20, 1),
  ('technical', 'Technical Execution', 'System architecture, code quality, technical complexity and functional execution', 20, 2),
  ('relevance', 'Problem Relevance', 'Significance of the problem addressed, clarity of problem statement', 20, 3),
  ('presentation', 'Presentation & Demonstration', 'Clarity of communication, pitch delivery, Q&A defense, live prototype demo', 20, 4),
  ('impact', 'Impact & Feasibility', 'Real-world utility, scalability, market potential and societal benefits', 20, 5)
ON CONFLICT (key) DO NOTHING;

-- =========================================================
-- 3. JUDGE EVALUATIONS TABLE
-- =========================================================
-- One evaluation per (judge_email, registration_id) pair.
-- Individual criterion scores stored separately alongside total_score.

CREATE TABLE IF NOT EXISTS public.judge_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_judge_project UNIQUE (judge_email, registration_id)
);

-- =========================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =========================================================

ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_evaluations ENABLE ROW LEVEL SECURITY;

-- Evaluation Criteria Policies
CREATE POLICY "Allow public read evaluation_criteria" ON public.evaluation_criteria
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full evaluation_criteria" ON public.evaluation_criteria
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Judge Evaluations Policies:
-- 1. Anyone authenticated (judge/admin) or anon client can select evaluations
CREATE POLICY "Allow select judge_evaluations" ON public.judge_evaluations
  FOR SELECT USING (true);

-- 2. Insert evaluation (judges submit evaluations)
CREATE POLICY "Allow insert judge_evaluations" ON public.judge_evaluations
  FOR INSERT WITH CHECK (true);

-- 3. Update evaluation
CREATE POLICY "Allow update judge_evaluations" ON public.judge_evaluations
  FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Delete evaluation (admins)
CREATE POLICY "Allow delete judge_evaluations" ON public.judge_evaluations
  FOR DELETE USING (true);

-- =========================================================
-- 5. PERFORMANCE INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_judge_evaluations_reg_id ON public.judge_evaluations(registration_id);
CREATE INDEX IF NOT EXISTS idx_judge_evaluations_judge_email ON public.judge_evaluations(judge_email);
CREATE INDEX IF NOT EXISTS idx_judge_evaluations_total_score ON public.judge_evaluations(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_judge_evaluations_created_at ON public.judge_evaluations(created_at DESC);
