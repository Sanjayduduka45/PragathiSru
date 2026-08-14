-- PRAGATHI 2K26 — Content Management Tables
-- Run this in your Supabase SQL Editor AFTER schema.sql has been applied.

-- ─── 1. SITE SETTINGS (single-row: event details + contact) ───────────────────

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL DEFAULT 'PRAGATHI 2K26',
  full_title TEXT NOT NULL DEFAULT 'PRAGATHI 2K26 — National Level Project Expo',
  tagline TEXT NOT NULL DEFAULT 'Innovate. Create. Inspire.',
  event_date TEXT NOT NULL DEFAULT '09 October 2026',
  target_date_iso TEXT NOT NULL DEFAULT '2026-10-09T09:00:00+05:30',
  venue TEXT NOT NULL DEFAULT 'SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371',
  institution TEXT NOT NULL DEFAULT 'SR University',
  location TEXT NOT NULL DEFAULT 'Warangal, Telangana',
  prize_pool TEXT NOT NULL DEFAULT '₹1,50,000',
  contact_email TEXT NOT NULL DEFAULT 'pragathi2k26@sru.edu.in',
  helpline TEXT NOT NULL DEFAULT '+91 870 281 8333',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. ABOUT CONTENT (single-row) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.about_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'About PRAGATHI 2K26',
  description TEXT NOT NULL DEFAULT '',
  vision TEXT DEFAULT '',
  objectives TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. PROJECT DOMAINS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Cpu',
  color TEXT NOT NULL DEFAULT 'from-blue-600 to-indigo-600',
  badge_text TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. SCHEDULE ITEMS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot TEXT NOT NULL,
  event_title TEXT NOT NULL,
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. RULES CONTENT (single-row) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rules_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. FAQS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. SPONSORS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sponsor_type TEXT DEFAULT 'Partner',
  role TEXT DEFAULT '',
  logo_text TEXT DEFAULT '',
  website TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ENABLE ROW LEVEL SECURITY ────────────────────────────────────────────────

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- ─── PUBLIC READ POLICIES (anon — public website can read all content) ─────────

CREATE POLICY "Public read site_settings"    ON public.site_settings    FOR SELECT USING (true);
CREATE POLICY "Public read about_content"    ON public.about_content    FOR SELECT USING (true);
CREATE POLICY "Public read project_domains"  ON public.project_domains  FOR SELECT USING (true);
CREATE POLICY "Public read schedule_items"   ON public.schedule_items   FOR SELECT USING (true);
CREATE POLICY "Public read rules_content"    ON public.rules_content    FOR SELECT USING (true);
CREATE POLICY "Public read faqs"             ON public.faqs             FOR SELECT USING (true);
CREATE POLICY "Public read sponsors"         ON public.sponsors         FOR SELECT USING (true);

-- ─── ADMIN WRITE POLICIES (authenticated — only signed-in admin can modify) ────

-- site_settings
CREATE POLICY "Admin insert site_settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- about_content
CREATE POLICY "Admin insert about_content" ON public.about_content FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update about_content" ON public.about_content FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- project_domains (full CRUD)
CREATE POLICY "Admin insert project_domains" ON public.project_domains FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update project_domains" ON public.project_domains FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete project_domains" ON public.project_domains FOR DELETE TO authenticated USING (true);

-- schedule_items (full CRUD)
CREATE POLICY "Admin insert schedule_items" ON public.schedule_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update schedule_items" ON public.schedule_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete schedule_items" ON public.schedule_items FOR DELETE TO authenticated USING (true);

-- rules_content
CREATE POLICY "Admin insert rules_content" ON public.rules_content FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update rules_content" ON public.rules_content FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- faqs (full CRUD)
CREATE POLICY "Admin insert faqs" ON public.faqs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update faqs" ON public.faqs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete faqs" ON public.faqs FOR DELETE TO authenticated USING (true);

-- sponsors (full CRUD)
CREATE POLICY "Admin insert sponsors" ON public.sponsors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update sponsors" ON public.sponsors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete sponsors" ON public.sponsors FOR DELETE TO authenticated USING (true);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
-- Inserts hardcoded defaults so the public website works immediately on first deploy.
-- Admin can update these values through the Admin Dashboard after seeding.

-- Site Settings
INSERT INTO public.site_settings (event_name, full_title, tagline, event_date, target_date_iso, venue, institution, location, prize_pool, contact_email, helpline)
VALUES (
  'PRAGATHI 2K26',
  'PRAGATHI 2K26 — National Level Project Expo',
  'Innovate. Create. Inspire.',
  '09 October 2026',
  '2026-10-09T09:00:00+05:30',
  'SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371',
  'SR University',
  'Warangal, Telangana',
  '₹1,50,000',
  'pragathi2k26@sru.edu.in',
  '+91 870 281 8333'
);

-- About Content
INSERT INTO public.about_content (title, description, vision, objectives)
VALUES (
  'About PRAGATHI 2K26',
  'PRAGATHI 2K26 is SR University''s flagship National Level Project Expo, designed to ignite youth innovation, foster interdisciplinary engineering solutions, and provide a stage for high-impact prototypes. Over 500 student teams from across India showcase hardware models, software applications, renewable energy solutions, and biotech inventions evaluated by senior academicians, scientists, and incubation mentors from the SRiX (SR Innovation Exchange) ecosystem.',
  'To create a nationally recognized platform that nurtures engineering talent, fosters innovation culture, and bridges the gap between academic learning and industry-ready solutions.',
  E'1. Provide a platform for student innovators to present working prototypes.\n2. Encourage interdisciplinary collaboration across engineering domains.\n3. Connect participants with industry mentors and incubation opportunities.\n4. Recognize outstanding innovations with merit awards and certificates.'
);

-- Project Domains
INSERT INTO public.project_domains (title, description, icon_name, color, badge_text, display_order) VALUES
('Software, AI & Data Science',         'Web & mobile applications, Machine Learning models, GenAI solutions, Cloud & Cybersecurity prototypes.',           'Cpu',        'from-blue-600 to-indigo-600',  'Software Track',      1),
('Hardware, IoT & Embedded Systems',    'Smart devices, sensor networks, robotics, drone tech, microcontrollers, and Industry 4.0 automation.',              'Zap',        'from-cyan-600 to-blue-700',    'Hardware Track',      2),
('Green Energy & Environmental Tech',   'Renewable energy systems, waste management, electric mobility, agricultural innovations, and eco-tech.',              'Leaf',       'from-emerald-600 to-teal-700', 'Sustainability Track', 3),
('Healthcare, MedTech & BioTech',       'Diagnostic devices, biomedical instruments, health tracking software, and bio-inspired engineering.',                'HeartPulse', 'from-rose-600 to-pink-700',    'Health Tech Track',   4),
('Smart Cities & Automation',           'Urban mobility, traffic management, smart grid systems, water management, and public safety tech.',                   'Building2',  'from-amber-600 to-orange-700', 'Civic Tech Track',    5),
('Open Innovation & Social Tech',       'Cross-disciplinary ideas, assistive tech for accessibility, educational tools, and high-impact social prototypes.',  'Lightbulb',  'from-blue-700 to-sky-600',     'Open Track',          6);

-- Schedule Items
INSERT INTO public.schedule_items (time_slot, event_title, location, description, badge, display_order) VALUES
('08:30 AM – 09:30 AM', 'On-site Registration & Stall Setup',       'SR University Expo Pavilion',          'Teams report to check-in counters, receive stall badges, and set up project displays.',                                           'Check-In',    1),
('09:30 AM – 10:15 AM', 'Grand Inauguration Ceremony',              'Main University Auditorium',           'Inaugural address by SR University Dignitaries, Chief Guests, and Industry Mentors.',                                            'Inauguration',2),
('10:30 AM – 01:30 PM', 'Jury Evaluation Phase I & Demonstration',  'Expo Halls A, B & C',                  'Expert panel evaluates working prototypes, code bases, and technical poster presentations.',                                      'Evaluation',  3),
('01:30 PM – 02:30 PM', 'Lunch & Networking Break',                 'University Food Court & Student Center','Networking lunch for participants, judges, faculty mentors, and visiting delegates.',                                           'Networking',  4),
('02:30 PM – 04:00 PM', 'Public Exhibition & Final Judging',         'Expo Pavilion',                        'Open viewing for students, school delegations, industry representatives, and final round reviews.',                              'Open Expo',   5),
('04:15 PM – 05:30 PM', 'Valedictory & Award Ceremony',             'Main Auditorium',                      'Announcement of category winners, prize distribution (₹1,50,000 pool), and closing remarks.',                                   'Awards',      6);

-- Rules Content
INSERT INTO public.rules_content (content) VALUES (
E'PARTICIPATION RULES & GUIDELINES\n\n1. ELIGIBILITY\n• Open to School students (Classes 8–12) and College/University students (Diploma, B.Tech, M.Tech, Degree, B.Sc) from recognized institutions across India.\n• Each team must have 1 to 5 members.\n• Solo participation is permitted.\n• Cross-departmental and cross-institutional teams are encouraged.\n\n2. PROJECT STANDARDS\n• Projects must be original work created by the registered team.\n• Projects must include a working prototype or functional demonstration.\n• Projects must fall within one of the six official PRAGATHI 2K26 domains.\n• Plagiarized or previously awarded projects from other expos will be disqualified.\n\n3. EXPO DAY CONDUCT\n• All team members must carry valid ID proof on Expo Day (college/school ID or government ID).\n• Teams must report to the check-in desk by 09:00 AM on 09 October 2026.\n• Each team will be allocated a stall. Teams must set up within the designated setup window.\n• Disruptive or inappropriate conduct will result in immediate disqualification.\n\n4. EVALUATION CRITERIA\n• Technical Merit (40%)\n• Innovation & Originality (25%)\n• Presentation & Communication (20%)\n• Real-world Impact & Scalability (15%)\n\n5. AWARDS & PRIZES\n• Top teams from each domain will be eligible for category prizes.\n• A Grand Innovation Prize will be awarded across all domains.\n• Total Prize Pool: ₹1,50,000\n\n6. CERTIFICATES\n• All registered participants presenting their project will receive official Certificates of Participation.\n• Category winners will receive Merit Certificates.'
);

-- FAQs
INSERT INTO public.faqs (question, answer, category, display_order) VALUES
('Who is eligible to participate in PRAGATHI 2K26?',       'PRAGATHI 2K26 is a National Level Expo open to both School students (Classes 8–12) and College/University students (Diploma, B.Tech, M.Tech, Degree, B.Sc) from recognized institutions across India.',  'Registration', 1),
('What is the team size requirement for registration?',     'Teams can consist of 1 to 5 members. Solo participation is permitted, and cross-departmental teams are encouraged.',                                                                                          'Registration', 2),
('How do I register my team for PRAGATHI 2K26?',            'Visit the Register page, enter your primary email address, fill in your team and institution details, provide your project title and abstract, then review and confirm your registration.',                      'Registration', 3),
('What happens after I submit my registration?',            'After successful registration, you will receive a unique Registration ID (e.g., PRAGATHI26-XXXXXX). Shortlisted teams will be notified with stall allocation details before Expo Day.',                          'Registration', 4),
('What facilities are provided at the stall on Expo Day?',  'Each registered and shortlisted team receives an allocated display stall with standard power supply, poster backing board, Wi-Fi connectivity, and table display space.',                                         'Expo Rules',   5),
('Will participants receive certificates?',                 'Yes. Registered participants will receive participation certificates for PRAGATHI 2K26.',                                                                                                                         'Expo Rules',   6),
('Will participants receive lunch?',                        'Yes. Lunch will be provided to registered participants during PRAGATHI 2K26 on the event day.',                                                                                                                   'Expo Rules',   7);

-- Sponsors
INSERT INTO public.sponsors (name, sponsor_type, role, logo_text, display_order) VALUES
('SRiX Incubator',                         'Incubation Partner', 'Startup Seed Grants & Mentorship',    'SRiX',    1),
('Institution''s Innovation Council (IIC)', 'Government Partner', 'Ministry of Education Initiative',   'MIC IIC', 2),
('IEEE SRU Student Branch',                 'Technical Partner',  'Technical Quality & Standards',       'IEEE',    3),
('SR University R&D Cell',                  'Academic Sponsor',   'Research & Prototyping Support',      'SRU R&D', 4);

-- ─── 8. TESTIMONIALS / PREVIOUS EVENT SHOWCASE ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  person_name TEXT NOT NULL,
  designation TEXT DEFAULT '',
  event_name TEXT DEFAULT '',
  event_year TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  image_alt TEXT DEFAULT '',
  image_aspect_ratio TEXT DEFAULT '16:9',
  image_position TEXT DEFAULT 'center',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Allow public insert testimonials" ON public.testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update testimonials" ON public.testimonials FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete testimonials" ON public.testimonials FOR DELETE USING (true);

-- ─── 9. CONTACT PEOPLE (Leadership & Coordinators) ────────────────────────────

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

ALTER TABLE public.contact_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read contact_people" ON public.contact_people FOR SELECT USING (true);
CREATE POLICY "Admin insert contact_people" ON public.contact_people FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update contact_people" ON public.contact_people FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete contact_people" ON public.contact_people FOR DELETE TO authenticated USING (true);

INSERT INTO public.contact_people (category, name, designation, mobile, email, display_order, is_active) VALUES
('leadership', 'Dr. CH. Hussaian Basha', 'Dean-Project Show Case', '9514418276', 'dean.psc@sru.edu.in', 1, true),
('leadership', 'Dr. Markala Karthik Reddy', 'Associate Dean Project Show Case', '7842227172', 'm.karthik@sru.edu.in', 2, true),
('leadership', 'Dr. Shravan Kumar Yadav', 'Associate Dean Project Show Case', '9040316409', 'shravan.kumar@sru.edu.in', 3, true),
('coordinator', 'Mr. Mohammad Afzal', 'Coordinator', '9100726799', '', 1, true),
('coordinator', 'Mr. Algol Sumanth', 'Coordinator', '7842421505', '', 2, true);

-- ─── 10. SYSTEM SETTINGS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_type TEXT NOT NULL DEFAULT 'json',
  description TEXT DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. USER ROLES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator', 'jury', 'participant')),
  display_name TEXT DEFAULT '',
  department TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 12. AUDIT LOGS ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL DEFAULT 'admin',
  target TEXT DEFAULT '',
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of public settings" ON public.system_settings FOR SELECT USING (is_public = true);
CREATE POLICY "Allow authenticated full access to system settings" ON public.system_settings FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow full access to user roles" ON public.user_roles FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow full access to audit logs" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');


