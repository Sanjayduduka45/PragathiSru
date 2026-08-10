-- PRAGATHI 2K26 - Supabase Relational Database Schema
-- Run this in your Supabase SQL Editor to initialize all 6 tables with RLS policies.

-- 1. INSTITUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('school', 'college', 'university')),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT UNIQUE NOT NULL, -- Format: PRAGATHI26-XXXXXX
  participant_type TEXT NOT NULL CHECK (participant_type IN ('sru_student', 'external_student')),
  team_name TEXT NOT NULL,
  team_size INT NOT NULL CHECK (team_size >= 1 AND team_size <= 5),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  leader_mobile TEXT,
  registration_status TEXT NOT NULL DEFAULT 'submitted' CHECK (registration_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'processing', 'paid', 'failed')),
  payment_amount NUMERIC DEFAULT 0,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEAM_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  roll_number TEXT,
  email TEXT NOT NULL,
  mobile TEXT,
  class_or_year TEXT,
  department TEXT,
  is_team_leader BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  problem_statement TEXT,
  objective TEXT,
  proposed_solution TEXT,
  innovation TEXT,
  applications TEXT,
  expected_outcomes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENT_VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  gateway_reference TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- PUBLIC RLS POLICIES FOR ANON CLIENT
CREATE POLICY "Allow public insert to registrations" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select registrations" ON public.registrations FOR SELECT USING (true);

CREATE POLICY "Allow public insert to institutions" ON public.institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select institutions" ON public.institutions FOR SELECT USING (true);

CREATE POLICY "Allow public insert to team_members" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select team_members" ON public.team_members FOR SELECT USING (true);

CREATE POLICY "Allow public insert to projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select projects" ON public.projects FOR SELECT USING (true);

CREATE POLICY "Allow public insert to student_verifications" ON public.student_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select student_verifications" ON public.student_verifications FOR SELECT USING (true);

CREATE POLICY "Allow public insert to payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select payments" ON public.payments FOR SELECT USING (true);
