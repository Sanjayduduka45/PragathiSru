-- PRAGATHI 2K26 — Contact People Table Migration
-- Run this in your Supabase SQL Editor to enable full CRUD for leadership and coordinators.

CREATE TABLE IF NOT EXISTS public.contact_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('leadership', 'coordinator')),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT DEFAULT '',
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.contact_people ENABLE ROW LEVEL SECURITY;

-- Public Read Policy
CREATE POLICY "Public read contact_people" 
  ON public.contact_people 
  FOR SELECT 
  USING (true);

-- Admin CRUD Policies
CREATE POLICY "Admin insert contact_people" 
  ON public.contact_people 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Admin update contact_people" 
  ON public.contact_people 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Admin delete contact_people" 
  ON public.contact_people 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Seed Initial Data
INSERT INTO public.contact_people (category, name, designation, mobile, email, display_order, is_active)
VALUES
  ('leadership', 'Dr. CH. Hussaian Basha', 'Dean-Project Show Case', '9514418276', 'dean.psc@sru.edu.in', 1, true),
  ('leadership', 'Dr. Markala Karthik Reddy', 'Associate Dean Project Show Case', '7842227172', 'm.karthik@sru.edu.in', 2, true),
  ('leadership', 'Dr. Shravan Kumar Yadav', 'Associate Dean Project Show Case', '9040316409', 'shravan.kumar@sru.edu.in', 3, true),
  ('coordinator', 'Mr. Mohammad Afzal', 'Coordinator', '9100726799', '', 1, true),
  ('coordinator', 'Mr. Algol Sumanth', 'Coordinator', '7842421505', '', 2, true)
ON CONFLICT DO NOTHING;
