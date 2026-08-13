-- PRAGATHI 2K26 — Phase 3: Poster Submissions Migration
-- Run this in your Supabase SQL Editor AFTER the main schema.sql has been applied.
-- This adds the poster_submissions table linked to registrations.

-- =========================================================
-- POSTER_SUBMISSIONS TABLE
-- =========================================================
-- One row per registration/team (enforced by UNIQUE on registration_id).
-- poster_content stores all poster fields as JSONB (no filenames).
-- status: 'draft' while participant is editing, 'submitted' when finalised.

CREATE TABLE IF NOT EXISTS public.poster_submissions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID        NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'submitted')),
  poster_content   JSONB,      -- Stores all poster field data
  submitted_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.poster_submissions ENABLE ROW LEVEL SECURITY;

-- Participants: anon client can insert and update (service will filter by registration_id in application logic)
CREATE POLICY "Allow public insert to poster_submissions"
  ON public.poster_submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select poster_submissions"
  ON public.poster_submissions FOR SELECT USING (true);

CREATE POLICY "Allow public update poster_submissions"
  ON public.poster_submissions FOR UPDATE USING (true) WITH CHECK (true);

-- Admin: authenticated users can select all submitted records
CREATE POLICY "Allow authenticated select all poster_submissions"
  ON public.poster_submissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated update poster_submissions"
  ON public.poster_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_poster_submissions_registration_id
  ON public.poster_submissions(registration_id);

CREATE INDEX IF NOT EXISTS idx_poster_submissions_status
  ON public.poster_submissions(status);

CREATE INDEX IF NOT EXISTS idx_poster_submissions_submitted_at
  ON public.poster_submissions(submitted_at DESC);

-- =========================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =========================================================

-- Reuse existing set_updated_at function if present, otherwise create it
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER poster_submissions_updated_at
  BEFORE UPDATE ON public.poster_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
