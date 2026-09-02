-- PRAGATHI 2K26 - Supabase Relational Database Schema
-- Run this in your Supabase SQL Editor to initialize all tables with RLS policies.

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
CREATE POLICY "Allow public delete registrations" ON public.registrations FOR DELETE USING (true);
CREATE POLICY "Allow public update registrations" ON public.registrations FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert to institutions" ON public.institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select institutions" ON public.institutions FOR SELECT USING (true);

CREATE POLICY "Allow public insert to team_members" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public delete team_members" ON public.team_members FOR DELETE USING (true);
CREATE POLICY "Allow public update team_members" ON public.team_members FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert to projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public delete projects" ON public.projects FOR DELETE USING (true);
CREATE POLICY "Allow public update projects" ON public.projects FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert to student_verifications" ON public.student_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select student_verifications" ON public.student_verifications FOR SELECT USING (true);

CREATE POLICY "Allow public insert to payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public delete payments" ON public.payments FOR DELETE USING (true);
CREATE POLICY "Allow public update payments" ON public.payments FOR UPDATE USING (true) WITH CHECK (true);

-- ADMIN RLS POLICIES (run these in Supabase SQL editor to enable Edit & Delete for the authenticated admin)
CREATE POLICY "Allow authenticated update registrations" ON public.registrations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete registrations" ON public.registrations
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated update team_members" ON public.team_members
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete team_members" ON public.team_members
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated update projects" ON public.projects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete projects" ON public.projects
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete payments" ON public.payments
  FOR DELETE TO authenticated USING (true);


-- ==========================================
-- PRAGATHI 2K26 CMS TABLES
-- ==========================================

-- 1. SITE_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL DEFAULT 'PRAGATHI 2K26',
  full_title TEXT DEFAULT 'PRAGATHI 2K26 — National Level Project Expo',
  tagline TEXT DEFAULT 'Innovate. Create. Inspire.',
  event_date TEXT DEFAULT '09 October 2026',
  target_date_iso TEXT DEFAULT '2026-10-09T09:00:00+05:30',
  venue TEXT DEFAULT 'SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371',
  institution TEXT DEFAULT 'SR University',
  location TEXT DEFAULT 'Warangal, Telangana',
  prize_pool TEXT DEFAULT '₹1,50,000',
  contact_email TEXT DEFAULT 'pragathi2k26@sru.edu.in',
  helpline TEXT DEFAULT '+91 870 281 8333',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ABOUT_CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.about_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT 'About PRAGATHI 2K26',
  description TEXT,
  vision TEXT,
  objectives JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECT_DOMAINS TABLE
CREATE TABLE IF NOT EXISTS public.project_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Cpu',
  color TEXT DEFAULT 'from-blue-600 to-indigo-600',
  badge_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SCHEDULE_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time TEXT,
  event TEXT NOT NULL,
  location TEXT,
  description TEXT,
  badge TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RULES_CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.rules_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rules_text JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FAQS TABLE
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SPONSORS TABLE
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sponsor_type TEXT,
  role TEXT,
  logo_text TEXT,
  logo_url TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONTACT_INFO TABLE
CREATE TABLE IF NOT EXISTS public.contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT DEFAULT 'pragathi2k26@sru.edu.in',
  phone TEXT DEFAULT '+91 870 281 8333',
  address TEXT DEFAULT 'SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371',
  office_hours TEXT DEFAULT 'Monday - Saturday: 9:00 AM - 5:00 PM',
  map_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  person_name TEXT,
  designation TEXT,
  event_name TEXT,
  event_year TEXT,
  image_url TEXT,
  media_type TEXT DEFAULT 'image',
  media_url TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY ON CMS TABLES
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ-ONLY POLICIES FOR VISITORS
CREATE POLICY "Allow public select site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public select about_content" ON public.about_content FOR SELECT USING (true);
CREATE POLICY "Allow public select project_domains" ON public.project_domains FOR SELECT USING (true);
CREATE POLICY "Allow public select schedule_items" ON public.schedule_items FOR SELECT USING (true);
CREATE POLICY "Allow public select rules_content" ON public.rules_content FOR SELECT USING (true);
CREATE POLICY "Allow public select faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Allow public select sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Allow public select contact_info" ON public.contact_info FOR SELECT USING (true);
CREATE POLICY "Allow public select testimonials" ON public.testimonials FOR SELECT USING (true);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_project_domains_order ON public.project_domains(display_order);
CREATE INDEX IF NOT EXISTS idx_schedule_items_order ON public.schedule_items(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON public.faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_sponsors_order ON public.sponsors(display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON public.testimonials(display_order);
