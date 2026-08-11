/**
 * contentService.ts
 *
 * Single source of truth for ALL content CRUD operations.
 * Every admin page and every public page goes through this service.
 *
 * Flow:
 *   Admin Page → contentService → Supabase DB → return updated data
 *   Public Page → contentService (read-only) → Supabase DB → display
 *
 * If Supabase is not configured, read functions return hardcoded fallback
 * data so the app still works in development without a live DB.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { EVENT_DETAILS } from '../utils/constants';
import {
  PROJECT_CATEGORIES,
  SCHEDULE_PREVIEW,
  FAQS,
  SPONSORS_PARTNERS,
} from '../data/eventData';

// ─── Exported Types ────────────────────────────────────────────────────────────

export interface SiteSettings {
  id?: string;
  eventName: string;
  fullTitle: string;
  tagline: string;
  eventDate: string;
  targetDateISO: string;
  venue: string;
  institution: string;
  location: string;
  prizePool: string;
  contactEmail: string;
  helpline: string;
}

export interface AboutContent {
  id?: string;
  title: string;
  description: string;
  vision: string;
  objectives: string;
}

/** Compatible with existing ProjectCategory from eventData.ts */
export interface DomainItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  badgeText: string;
  active: boolean;
  displayOrder: number;
}

/** Compatible with existing ScheduleItem from eventData.ts */
export interface ScheduleEntry {
  id: string;
  time: string;
  event: string;
  location: string;
  description: string;
  badge: string;
  active: boolean;
  displayOrder: number;
}

/** Compatible with existing FAQItem from eventData.ts */
export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  order: number;
}

/** Compatible with existing SponsorPartner from eventData.ts */
export interface SponsorEntry {
  id: string;
  name: string;
  type: string;
  role: string;
  logoText: string;
  website: string;
  active: boolean;
  order: number;
}

// ─── Hardcoded Fallback Defaults ───────────────────────────────────────────────
// Used when Supabase is not configured. Matches existing eventData.ts values.

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  eventName: EVENT_DETAILS.name,
  fullTitle: EVENT_DETAILS.fullTitle,
  tagline: EVENT_DETAILS.tagline,
  eventDate: EVENT_DETAILS.eventDate,
  targetDateISO: EVENT_DETAILS.targetDateISO,
  venue: EVENT_DETAILS.venue,
  institution: EVENT_DETAILS.institution,
  location: EVENT_DETAILS.location,
  prizePool: EVENT_DETAILS.prizePool,
  contactEmail: EVENT_DETAILS.contactEmail,
  helpline: EVENT_DETAILS.helpline,
};

export const DEFAULT_ABOUT: AboutContent = {
  title: 'About PRAGATHI 2K26',
  description:
    "PRAGATHI 2K26 is SR University's flagship National Level Project Expo, designed to ignite youth innovation, foster interdisciplinary engineering solutions, and provide a stage for high-impact prototypes.",
  vision:
    'To create a nationally recognized platform that nurtures engineering talent, fosters innovation culture, and bridges the gap between academic learning and industry-ready solutions.',
  objectives:
    '1. Provide a platform for student innovators to present working prototypes.\n2. Encourage interdisciplinary collaboration across engineering domains.\n3. Connect participants with industry mentors and incubation opportunities.\n4. Recognize outstanding innovations with merit awards and certificates.',
};

const DEFAULT_RULES = `PARTICIPATION RULES & GUIDELINES

1. ELIGIBILITY
• Open to School students (Classes 8–12) and College/University students (Diploma, B.Tech, M.Tech, Degree, B.Sc) from recognized institutions across India.
• Each team must have 1 to 5 members.
• Solo participation is permitted.
• Cross-departmental and cross-institutional teams are encouraged.

2. PROJECT STANDARDS
• Projects must be original work created by the registered team.
• Projects must include a working prototype or functional demonstration.
• Projects must fall within one of the six official PRAGATHI 2K26 domains.
• Plagiarized or previously awarded projects from other expos will be disqualified.

3. EXPO DAY CONDUCT
• All team members must carry valid ID proof on Expo Day (college/school ID or government ID).
• Teams must report to the check-in desk by 09:00 AM on 09 October 2026.
• Each team will be allocated a stall. Teams must set up within the designated setup window.
• Disruptive or inappropriate conduct will result in immediate disqualification.

4. EVALUATION CRITERIA
• Technical Merit (40%)
• Innovation & Originality (25%)
• Presentation & Communication (20%)
• Real-world Impact & Scalability (15%)

5. AWARDS & PRIZES
• Top teams from each domain will be eligible for category prizes.
• A Grand Innovation Prize will be awarded across all domains.
• Total Prize Pool: ₹1,50,000

6. CERTIFICATES
• All registered participants presenting their project will receive official Certificates of Participation.
• Category winners will receive Merit Certificates.`;

// ─── Row Mappers (DB snake_case → TS camelCase) ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSiteSettings(row: any): SiteSettings {
  return {
    id: row.id,
    eventName: row.event_name,
    fullTitle: row.full_title,
    tagline: row.tagline,
    eventDate: row.event_date,
    targetDateISO: row.target_date_iso,
    venue: row.venue,
    institution: row.institution,
    location: row.location,
    prizePool: row.prize_pool,
    contactEmail: row.contact_email,
    helpline: row.helpline,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAboutContent(row: any): AboutContent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    vision: row.vision ?? '',
    objectives: row.objectives ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDomainItem(row: any): DomainItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    iconName: row.icon_name ?? 'Cpu',
    color: row.color ?? 'from-blue-600 to-indigo-600',
    badgeText: row.badge_text ?? '',
    active: row.is_active ?? true,
    displayOrder: row.display_order ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToScheduleEntry(row: any): ScheduleEntry {
  return {
    id: row.id,
    time: row.time_slot,
    event: row.event_title,
    location: row.location ?? '',
    description: row.description ?? '',
    badge: row.badge ?? '',
    active: row.is_active ?? true,
    displayOrder: row.display_order ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFAQEntry(row: any): FAQEntry {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category ?? 'General',
    active: row.is_active ?? true,
    order: row.display_order ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSponsorEntry(row: any): SponsorEntry {
  return {
    id: row.id,
    name: row.name,
    type: row.sponsor_type ?? 'Partner',
    role: row.role ?? '',
    logoText: row.logo_text ?? '',
    website: row.website ?? '',
    active: row.is_active ?? true,
    order: row.display_order ?? 0,
  };
}

// ─── SITE SETTINGS ────────────────────────────────────────────────────────────

export async function getEventSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_SITE_SETTINGS;

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[contentService] getEventSettings error:', error.message);
    return DEFAULT_SITE_SETTINGS;
  }
  if (!data) return DEFAULT_SITE_SETTINGS;
  return rowToSiteSettings(data);
}

export async function updateEventSettings(
  settings: Partial<SiteSettings>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Changes cannot be persisted.');
  }

  // Check if a row exists
  const { data: existing, error: fetchErr } = await supabase
    .from('site_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (settings.eventName   !== undefined) payload.event_name     = settings.eventName;
  if (settings.fullTitle   !== undefined) payload.full_title     = settings.fullTitle;
  if (settings.tagline     !== undefined) payload.tagline        = settings.tagline;
  if (settings.eventDate   !== undefined) payload.event_date     = settings.eventDate;
  if (settings.targetDateISO !== undefined) payload.target_date_iso = settings.targetDateISO;
  if (settings.venue       !== undefined) payload.venue          = settings.venue;
  if (settings.institution !== undefined) payload.institution    = settings.institution;
  if (settings.location    !== undefined) payload.location       = settings.location;
  if (settings.prizePool   !== undefined) payload.prize_pool     = settings.prizePool;
  if (settings.contactEmail !== undefined) payload.contact_email = settings.contactEmail;
  if (settings.helpline    !== undefined) payload.helpline       = settings.helpline;

  if (existing) {
    const { error } = await supabase
      .from('site_settings')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('site_settings').insert(payload);
    if (error) throw new Error(error.message);
  }
}

// ─── ABOUT CONTENT ────────────────────────────────────────────────────────────

export async function getAboutContent(): Promise<AboutContent> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_ABOUT;

  const { data, error } = await supabase
    .from('about_content')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[contentService] getAboutContent error:', error.message);
    return DEFAULT_ABOUT;
  }
  if (!data) return DEFAULT_ABOUT;
  return rowToAboutContent(data);
}

export async function updateAboutContent(content: AboutContent): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Changes cannot be persisted.');
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('about_content')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);

  const payload = {
    title: content.title,
    description: content.description,
    vision: content.vision,
    objectives: content.objectives,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from('about_content')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('about_content').insert(payload);
    if (error) throw new Error(error.message);
  }
}

// ─── PROJECT DOMAINS ──────────────────────────────────────────────────────────

export async function getDomains(): Promise<DomainItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    // Return hardcoded fallback with required DomainItem fields
    return PROJECT_CATEGORIES.map((c, i) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      iconName: c.iconName,
      color: c.color,
      badgeText: c.badgeText,
      active: true,
      displayOrder: i + 1,
    }));
  }

  const { data, error } = await supabase
    .from('project_domains')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[contentService] getDomains error:', error.message);
    return PROJECT_CATEGORIES.map((c, i) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      iconName: c.iconName,
      color: c.color,
      badgeText: c.badgeText,
      active: true,
      displayOrder: i + 1,
    }));
  }
  return (data ?? []).map(rowToDomainItem);
}

export async function addDomain(
  d: Omit<DomainItem, 'id'>
): Promise<DomainItem> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('project_domains')
    .insert({
      title: d.title,
      description: d.description,
      icon_name: d.iconName,
      color: d.color,
      badge_text: d.badgeText,
      is_active: d.active,
      display_order: d.displayOrder,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToDomainItem(data);
}

export async function updateDomain(
  id: string,
  d: Partial<Omit<DomainItem, 'id'>>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (d.title       !== undefined) payload.title         = d.title;
  if (d.description !== undefined) payload.description   = d.description;
  if (d.iconName    !== undefined) payload.icon_name     = d.iconName;
  if (d.color       !== undefined) payload.color         = d.color;
  if (d.badgeText   !== undefined) payload.badge_text    = d.badgeText;
  if (d.active      !== undefined) payload.is_active     = d.active;
  if (d.displayOrder !== undefined) payload.display_order = d.displayOrder;

  const { error } = await supabase
    .from('project_domains')
    .update(payload)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteDomain(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('project_domains').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── SCHEDULE ITEMS ───────────────────────────────────────────────────────────

export async function getScheduleItems(): Promise<ScheduleEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    return SCHEDULE_PREVIEW.map((s, i) => ({
      id: `sch-${i}`,
      time: s.time,
      event: s.event,
      location: s.location,
      description: s.description,
      badge: s.badge,
      active: true,
      displayOrder: i + 1,
    }));
  }

  const { data, error } = await supabase
    .from('schedule_items')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[contentService] getScheduleItems error:', error.message);
    return SCHEDULE_PREVIEW.map((s, i) => ({
      id: `sch-${i}`,
      time: s.time,
      event: s.event,
      location: s.location,
      description: s.description,
      badge: s.badge,
      active: true,
      displayOrder: i + 1,
    }));
  }
  return (data ?? []).map(rowToScheduleEntry);
}

export async function addScheduleItem(
  s: Omit<ScheduleEntry, 'id'>
): Promise<ScheduleEntry> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('schedule_items')
    .insert({
      time_slot: s.time,
      event_title: s.event,
      location: s.location,
      description: s.description,
      badge: s.badge,
      is_active: s.active,
      display_order: s.displayOrder,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToScheduleEntry(data);
}

export async function updateScheduleItem(
  id: string,
  s: Partial<Omit<ScheduleEntry, 'id'>>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (s.time        !== undefined) payload.time_slot    = s.time;
  if (s.event       !== undefined) payload.event_title  = s.event;
  if (s.location    !== undefined) payload.location     = s.location;
  if (s.description !== undefined) payload.description  = s.description;
  if (s.badge       !== undefined) payload.badge        = s.badge;
  if (s.active      !== undefined) payload.is_active    = s.active;
  if (s.displayOrder !== undefined) payload.display_order = s.displayOrder;

  const { error } = await supabase
    .from('schedule_items')
    .update(payload)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteScheduleItem(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('schedule_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── RULES CONTENT ────────────────────────────────────────────────────────────

export async function getRulesContent(): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_RULES;

  const { data, error } = await supabase
    .from('rules_content')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[contentService] getRulesContent error:', error.message);
    return DEFAULT_RULES;
  }
  if (!data) return DEFAULT_RULES;
  return data.content ?? DEFAULT_RULES;
}

export async function updateRulesContent(content: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { data: existing, error: fetchErr } = await supabase
    .from('rules_content')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);

  if (existing) {
    const { error } = await supabase
      .from('rules_content')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('rules_content').insert({ content });
    if (error) throw new Error(error.message);
  }
}

// ─── FAQS ─────────────────────────────────────────────────────────────────────

export async function getFaqs(): Promise<FAQEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    return FAQS.map((f, i) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category,
      active: true,
      order: i + 1,
    }));
  }

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[contentService] getFaqs error:', error.message);
    return FAQS.map((f, i) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category,
      active: true,
      order: i + 1,
    }));
  }
  return (data ?? []).map(rowToFAQEntry);
}

export async function addFaq(f: Omit<FAQEntry, 'id'>): Promise<FAQEntry> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('faqs')
    .insert({
      question: f.question,
      answer: f.answer,
      category: f.category,
      is_active: f.active,
      display_order: f.order,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToFAQEntry(data);
}

export async function updateFaq(
  id: string,
  f: Partial<Omit<FAQEntry, 'id'>>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (f.question  !== undefined) payload.question      = f.question;
  if (f.answer    !== undefined) payload.answer        = f.answer;
  if (f.category  !== undefined) payload.category      = f.category;
  if (f.active    !== undefined) payload.is_active     = f.active;
  if (f.order     !== undefined) payload.display_order = f.order;

  const { error } = await supabase.from('faqs').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteFaq(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── SPONSORS ─────────────────────────────────────────────────────────────────

export async function getSponsors(): Promise<SponsorEntry[]> {
  if (!isSupabaseConfigured || !supabase) {
    return SPONSORS_PARTNERS.map((s, i) => ({
      id: `sponsor-${i}`,
      name: s.name,
      type: s.type,
      role: s.role,
      logoText: s.logoText,
      website: '',
      active: true,
      order: i + 1,
    }));
  }

  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[contentService] getSponsors error:', error.message);
    return SPONSORS_PARTNERS.map((s, i) => ({
      id: `sponsor-${i}`,
      name: s.name,
      type: s.type,
      role: s.role,
      logoText: s.logoText,
      website: '',
      active: true,
      order: i + 1,
    }));
  }
  return (data ?? []).map(rowToSponsorEntry);
}

export async function addSponsor(
  s: Omit<SponsorEntry, 'id'>
): Promise<SponsorEntry> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('sponsors')
    .insert({
      name: s.name,
      sponsor_type: s.type,
      role: s.role,
      logo_text: s.logoText,
      website: s.website,
      is_active: s.active,
      display_order: s.order,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToSponsorEntry(data);
}

export async function updateSponsor(
  id: string,
  s: Partial<Omit<SponsorEntry, 'id'>>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (s.name    !== undefined) payload.name         = s.name;
  if (s.type    !== undefined) payload.sponsor_type = s.type;
  if (s.role    !== undefined) payload.role         = s.role;
  if (s.logoText !== undefined) payload.logo_text   = s.logoText;
  if (s.website !== undefined) payload.website      = s.website;
  if (s.active  !== undefined) payload.is_active    = s.active;
  if (s.order   !== undefined) payload.display_order = s.order;

  const { error } = await supabase.from('sponsors').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSponsor(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase)
    throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('sponsors').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Live Count Helpers (for AdminDashboard stats) ─────────────────────────────

export async function getDomainCount(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return PROJECT_CATEGORIES.length;
  const { count, error } = await supabase
    .from('project_domains')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  if (error) return PROJECT_CATEGORIES.length;
  return count ?? 0;
}

export async function getFaqCount(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return FAQS.length;
  const { count, error } = await supabase
    .from('faqs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  if (error) return FAQS.length;
  return count ?? 0;
}
