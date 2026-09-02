/**
 * contentService.ts
 *
 * Single source of truth for ALL content CRUD operations in React.
 * Every admin page and every public page goes through this service.
 *
 * Architecture:
 * 1. Primary: Calls FastAPI Python Backend (`api.*` from `./api.ts`).
 * 2. Fallback: Queries Supabase PostgreSQL tables directly if FastAPI is unreachable.
 * 3. Default: Returns static constants if both DB and FastAPI are loading/unreachable.
 */

import { api } from './api';
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
  linkedinUrl: string;
  facebookUrl: string;
  instagramUrl: string;
}

export interface AboutContent {
  id?: string;
  title: string;
  description: string;
  vision: string;
  objectives: string;
}

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

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  order: number;
}

export interface SponsorEntry {
  id: string;
  name: string;
  type: string;
  role: string;
  logoText: string;
  logoUrl: string;
  website: string;
  active: boolean;
  order: number;
}

export interface TestimonialEntry {
  id: string;
  title: string;
  description: string;
  personName?: string;
  designation: string;
  eventName: string;
  eventYear: string;
  imageUrl: string;
  imageAlt: string;
  imageAspectRatio: string;
  imagePosition: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  thumbnailUrl?: string;
  active: boolean;
  order: number;
}

// ─── Hardcoded Fallback Defaults ───────────────────────────────────────────────

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
  linkedinUrl: EVENT_DETAILS.linkedinUrl,
  facebookUrl: EVENT_DETAILS.facebookUrl,
  instagramUrl: EVENT_DETAILS.instagramUrl,
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

// ─── SITE SETTINGS ────────────────────────────────────────────────────────────

export async function getEventSettings(): Promise<SiteSettings> {
  try {
    const res = await api.event.get();
    if (res && res.data) {
      const d = res.data;
      return {
        eventName: d.event_name ?? DEFAULT_SITE_SETTINGS.eventName,
        fullTitle: d.full_title ?? DEFAULT_SITE_SETTINGS.fullTitle,
        tagline: d.tagline ?? DEFAULT_SITE_SETTINGS.tagline,
        eventDate: d.event_date ?? DEFAULT_SITE_SETTINGS.eventDate,
        targetDateISO: d.target_date_iso ?? DEFAULT_SITE_SETTINGS.targetDateISO,
        venue: d.venue ?? DEFAULT_SITE_SETTINGS.venue,
        institution: d.institution ?? DEFAULT_SITE_SETTINGS.institution,
        location: d.location ?? DEFAULT_SITE_SETTINGS.location,
        prizePool: d.prize_pool ?? DEFAULT_SITE_SETTINGS.prizePool,
        contactEmail: d.contact_email ?? DEFAULT_SITE_SETTINGS.contactEmail,
        helpline: d.helpline ?? DEFAULT_SITE_SETTINGS.helpline,
        linkedinUrl: d.linkedin_url ?? DEFAULT_SITE_SETTINGS.linkedinUrl,
        facebookUrl: d.facebook_url ?? DEFAULT_SITE_SETTINGS.facebookUrl,
        instagramUrl: d.instagram_url ?? DEFAULT_SITE_SETTINGS.instagramUrl,
      };
    }
  } catch (err) {
    console.warn('[contentService] getEventSettings FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('site_settings').select('*').limit(1);
      if (data && data.length > 0) {
        const d = data[0];
        return {
          eventName: d.event_name ?? DEFAULT_SITE_SETTINGS.eventName,
          fullTitle: d.full_title ?? DEFAULT_SITE_SETTINGS.fullTitle,
          tagline: d.tagline ?? DEFAULT_SITE_SETTINGS.tagline,
          eventDate: d.event_date ?? DEFAULT_SITE_SETTINGS.eventDate,
          targetDateISO: d.target_date_iso ?? DEFAULT_SITE_SETTINGS.targetDateISO,
          venue: d.venue ?? DEFAULT_SITE_SETTINGS.venue,
          institution: d.institution ?? DEFAULT_SITE_SETTINGS.institution,
          location: d.location ?? DEFAULT_SITE_SETTINGS.location,
          prizePool: d.prize_pool ?? DEFAULT_SITE_SETTINGS.prizePool,
          contactEmail: d.contact_email ?? DEFAULT_SITE_SETTINGS.contactEmail,
          helpline: d.helpline ?? DEFAULT_SITE_SETTINGS.helpline,
          linkedinUrl: d.linkedin_url ?? DEFAULT_SITE_SETTINGS.linkedinUrl,
          facebookUrl: d.facebook_url ?? DEFAULT_SITE_SETTINGS.facebookUrl,
          instagramUrl: d.instagram_url ?? DEFAULT_SITE_SETTINGS.instagramUrl,
        };
      }
    } catch (sErr) {
      console.warn('[contentService] getEventSettings Supabase fallback error:', sErr);
    }
  }

  return DEFAULT_SITE_SETTINGS;
}

export async function updateEventSettings(settings: Partial<SiteSettings>): Promise<void> {
  const current = await getEventSettings();
  const merged: SiteSettings = {
    eventName: settings.eventName ?? current.eventName,
    fullTitle: settings.fullTitle ?? current.fullTitle,
    tagline: settings.tagline ?? current.tagline,
    eventDate: settings.eventDate ?? current.eventDate,
    targetDateISO: settings.targetDateISO ?? current.targetDateISO,
    venue: settings.venue ?? current.venue,
    institution: settings.institution ?? current.institution,
    location: settings.location ?? current.location,
    prizePool: settings.prizePool ?? current.prizePool,
    contactEmail: settings.contactEmail ?? current.contactEmail,
    helpline: settings.helpline ?? current.helpline,
    linkedinUrl: settings.linkedinUrl ?? current.linkedinUrl,
    facebookUrl: settings.facebookUrl ?? current.facebookUrl,
    instagramUrl: settings.instagramUrl ?? current.instagramUrl,
  };

  const payload = {
    event_name: merged.eventName,
    full_title: merged.fullTitle,
    tagline: merged.tagline,
    event_date: merged.eventDate,
    target_date_iso: merged.targetDateISO,
    venue: merged.venue,
    institution: merged.institution,
    location: merged.location,
    prize_pool: merged.prizePool,
    contact_email: merged.contactEmail,
    helpline: merged.helpline,
    linkedin_url: merged.linkedinUrl,
    facebook_url: merged.facebookUrl,
    instagram_url: merged.instagramUrl,
  };

  try {
    await api.event.update(payload);
    return;
  } catch (err) {
    console.warn('[contentService] updateEventSettings FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('site_settings').upsert([payload]);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

// ─── ABOUT CONTENT ────────────────────────────────────────────────────────────

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const res = await api.about.get();
    if (res && res.data) {
      return {
        title: res.data.title ?? DEFAULT_ABOUT.title,
        description: res.data.description ?? DEFAULT_ABOUT.description,
        vision: res.data.vision ?? DEFAULT_ABOUT.vision,
        objectives: res.data.objectives ?? DEFAULT_ABOUT.objectives,
      };
    }
  } catch (err) {
    console.warn('[contentService] getAboutContent FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('about_content').select('*').limit(1);
      if (data && data.length > 0) {
        return {
          title: data[0].title ?? DEFAULT_ABOUT.title,
          description: data[0].description ?? DEFAULT_ABOUT.description,
          vision: data[0].vision ?? DEFAULT_ABOUT.vision,
          objectives: data[0].objectives ?? DEFAULT_ABOUT.objectives,
        };
      }
    } catch (sErr) {
      console.warn('[contentService] getAboutContent Supabase fallback error:', sErr);
    }
  }

  return DEFAULT_ABOUT;
}

export async function updateAboutContent(content: AboutContent): Promise<void> {
  try {
    await api.about.update(content);
    return;
  } catch (err) {
    console.warn('[contentService] updateAboutContent FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('about_content').upsert([content]);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function resetAboutContent(): Promise<AboutContent> {
  try {
    await api.about.delete();
  } catch (err) {
    console.warn('[contentService] resetAboutContent FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('about_content').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (sErr) {
        console.warn('[contentService] resetAboutContent Supabase fallback error:', sErr);
      }
    }
  }
  return DEFAULT_ABOUT;
}

// ─── PROJECT DOMAINS ──────────────────────────────────────────────────────────

export async function getDomains(): Promise<DomainItem[]> {
  try {
    const res = await api.domains.get();
    if (res && Array.isArray(res.data)) {
      return res.data.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description || '',
        iconName: d.icon_name || 'Cpu',
        color: d.color || 'from-blue-600 to-indigo-600',
        badgeText: d.badge_text || '',
        active: d.active ?? true,
        displayOrder: d.display_order ?? 0,
      }));
    }
  } catch (err) {
    console.warn('[contentService] getDomains FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('project_domains').select('*').order('display_order', { ascending: true });
      if (data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          iconName: d.icon_name || 'Cpu',
          color: d.color || 'from-blue-600 to-indigo-600',
          badgeText: d.badge_text || '',
          active: d.is_active ?? true,
          displayOrder: d.display_order ?? 0,
        }));
      }
    } catch (sErr) {
      console.warn('[contentService] getDomains Supabase fallback error:', sErr);
    }
  }

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

export async function addDomain(d: Omit<DomainItem, 'id'>): Promise<DomainItem> {
  const payload = {
    title: d.title,
    description: d.description,
    icon_name: d.iconName,
    color: d.color,
    badge_text: d.badgeText,
    active: d.active,
    display_order: d.displayOrder,
  };

  try {
    const res = await api.domains.create(payload);
    const data = res.data;
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      iconName: data.icon_name || 'Cpu',
      color: data.color || 'from-blue-600 to-indigo-600',
      badgeText: data.badge_text || '',
      active: data.active ?? true,
      displayOrder: data.display_order ?? 0,
    };
  } catch (err) {
    console.warn('[contentService] addDomain FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('project_domains').insert([{
        title: d.title,
        description: d.description,
        icon_name: d.iconName,
        color: d.color,
        badge_text: d.badgeText,
        is_active: d.active,
        display_order: d.displayOrder,
      }]).select('*');
      if (!error && data && data[0]) {
        return {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description || '',
          iconName: data[0].icon_name || 'Cpu',
          color: data[0].color || 'from-blue-600 to-indigo-600',
          badgeText: data[0].badge_text || '',
          active: data[0].is_active ?? true,
          displayOrder: data[0].display_order ?? 0,
        };
      }
      throw new Error(`Database error: ${error?.message || 'Failed to insert'}`);
    }
    throw err;
  }
}

export async function updateDomain(id: string, d: Partial<Omit<DomainItem, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (d.title !== undefined) payload.title = d.title;
  if (d.description !== undefined) payload.description = d.description;
  if (d.iconName !== undefined) payload.icon_name = d.iconName;
  if (d.color !== undefined) payload.color = d.color;
  if (d.badgeText !== undefined) payload.badge_text = d.badgeText;
  if (d.active !== undefined) payload.active = d.active;
  if (d.displayOrder !== undefined) payload.display_order = d.displayOrder;

  try {
    await api.domains.update(id, payload);
    return;
  } catch (err) {
    console.warn('[contentService] updateDomain FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('project_domains').update(payload).eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function deleteDomain(id: string): Promise<void> {
  try {
    await api.domains.delete(id);
    return;
  } catch (err) {
    console.warn('[contentService] deleteDomain FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('project_domains').delete().eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

// ─── SCHEDULE ITEMS ───────────────────────────────────────────────────────────

export async function getScheduleItems(): Promise<ScheduleEntry[]> {
  try {
    const res = await api.schedule.get();
    if (res && Array.isArray(res.data)) {
      return res.data.map((s: any) => ({
        id: s.id,
        time: s.time || s.time_slot || '',
        event: s.event || s.event_title || '',
        location: s.location || '',
        description: s.description || '',
        badge: s.badge || '',
        active: s.active ?? true,
        displayOrder: s.display_order ?? 0,
      }));
    }
  } catch (err) {
    console.warn('[contentService] getScheduleItems FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('schedule_items').select('*').order('display_order', { ascending: true });
      if (data && data.length > 0) {
        return data.map((s: any) => ({
          id: s.id,
          time: s.time_slot || '',
          event: s.event_title || '',
          location: s.location || '',
          description: s.description || '',
          badge: s.badge || '',
          active: s.is_active ?? true,
          displayOrder: s.display_order ?? 0,
        }));
      }
    } catch (sErr) {
      console.warn('[contentService] getScheduleItems Supabase fallback error:', sErr);
    }
  }

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

export async function addScheduleItem(s: Omit<ScheduleEntry, 'id'>): Promise<ScheduleEntry> {
  const payload = {
    time: s.time,
    event: s.event,
    location: s.location,
    description: s.description,
    badge: s.badge,
    active: s.active,
    display_order: s.displayOrder,
  };

  try {
    const res = await api.schedule.create(payload);
    const data = res.data;
    return {
      id: data.id,
      time: data.time || data.time_slot || '',
      event: data.event || data.event_title || '',
      location: data.location || '',
      description: data.description || '',
      badge: data.badge || '',
      active: data.active ?? true,
      displayOrder: data.display_order ?? 0,
    };
  } catch (err) {
    console.warn('[contentService] addScheduleItem FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('schedule_items').insert([{
        time_slot: s.time,
        event_title: s.event,
        location: s.location,
        description: s.description,
        badge: s.badge,
        is_active: s.active,
        display_order: s.displayOrder,
      }]).select('*');
      if (!error && data && data[0]) {
        return {
          id: data[0].id,
          time: data[0].time_slot || '',
          event: data[0].event_title || '',
          location: data[0].location || '',
          description: data[0].description || '',
          badge: data[0].badge || '',
          active: data[0].is_active ?? true,
          displayOrder: data[0].display_order ?? 0,
        };
      }
      throw new Error(`Database error: ${error?.message || 'Failed to insert'}`);
    }
    throw err;
  }
}

export async function updateScheduleItem(id: string, s: Partial<Omit<ScheduleEntry, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (s.time !== undefined) payload.time_slot = s.time;
  if (s.event !== undefined) payload.event_title = s.event;
  if (s.location !== undefined) payload.location = s.location;
  if (s.description !== undefined) payload.description = s.description;
  if (s.badge !== undefined) payload.badge = s.badge;
  if (s.active !== undefined) payload.is_active = s.active;
  if (s.displayOrder !== undefined) payload.display_order = s.displayOrder;

  try {
    await api.schedule.update(id, payload);
    return;
  } catch (err) {
    console.warn('[contentService] updateScheduleItem FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('schedule_items').update(payload).eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function deleteScheduleItem(id: string): Promise<void> {
  try {
    await api.schedule.delete(id);
    return;
  } catch (err) {
    console.warn('[contentService] deleteScheduleItem FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('schedule_items').delete().eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

// ─── RULES CONTENT ────────────────────────────────────────────────────────────

export async function getRulesContent(): Promise<string> {
  try {
    const res = await api.rules.get();
    if (res && res.data && res.data.content) {
      return res.data.content;
    }
  } catch (err) {
    console.warn('[contentService] getRulesContent FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('rules_content').select('*').limit(1);
      if (data && data.length > 0 && data[0].content) {
        return data[0].content;
      }
    } catch (sErr) {
      console.warn('[contentService] getRulesContent Supabase fallback error:', sErr);
    }
  }

  return DEFAULT_RULES;
}

export async function updateRulesContent(content: string): Promise<void> {
  try {
    await api.rules.update({ content });
    return;
  } catch (err) {
    console.warn('[contentService] updateRulesContent FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('rules_content').upsert([{ content }]);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

// ─── FAQS ─────────────────────────────────────────────────────────────────────

export async function getFaqs(): Promise<FAQEntry[]> {
  try {
    const res = await api.faqs.get();
    if (res && Array.isArray(res.data)) {
      return res.data.map((f: any) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category || 'General',
        active: f.active ?? true,
        order: f.order ?? f.display_order ?? 0,
      }));
    }
  } catch (err) {
    console.warn('[contentService] getFaqs FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('faqs').select('*').order('display_order', { ascending: true });
      if (data && data.length > 0) {
        return data.map((f: any) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          category: f.category || 'General',
          active: f.is_active ?? true,
          order: f.display_order ?? 0,
        }));
      }
    } catch (sErr) {
      console.warn('[contentService] getFaqs Supabase fallback error:', sErr);
    }
  }

  return FAQS.map((f, i) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    active: true,
    order: i + 1,
  }));
}

export async function addFaq(f: Omit<FAQEntry, 'id'>): Promise<FAQEntry> {
  const payload = {
    question: f.question,
    answer: f.answer,
    category: f.category,
    active: f.active,
    order: f.order,
  };

  try {
    const res = await api.faqs.create(payload);
    const data = res.data;
    return {
      id: data.id,
      question: data.question,
      answer: data.answer,
      category: data.category || 'General',
      active: data.active ?? true,
      order: data.order ?? 0,
    };
  } catch (err) {
    console.warn('[contentService] addFaq FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('faqs').insert([{
        question: f.question,
        answer: f.answer,
        category: f.category,
        is_active: f.active,
        display_order: f.order,
      }]).select('*');
      if (!error && data && data[0]) {
        return {
          id: data[0].id,
          question: data[0].question,
          answer: data[0].answer,
          category: data[0].category || 'General',
          active: data[0].is_active ?? true,
          order: data[0].display_order ?? 0,
        };
      }
      throw new Error(`Database error: ${error?.message || 'Failed to insert'}`);
    }
    throw err;
  }
}

export async function updateFaq(id: string, f: Partial<Omit<FAQEntry, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (f.question !== undefined) payload.question = f.question;
  if (f.answer !== undefined) payload.answer = f.answer;
  if (f.category !== undefined) payload.category = f.category;
  if (f.active !== undefined) payload.is_active = f.active;
  if (f.order !== undefined) payload.display_order = f.order;

  try {
    await api.faqs.update(id, payload);
    return;
  } catch (err) {
    console.warn('[contentService] updateFaq FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('faqs').update(payload).eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function deleteFaq(id: string): Promise<void> {
  try {
    await api.faqs.delete(id);
    return;
  } catch (err) {
    console.warn('[contentService] deleteFaq FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

// ─── SPONSORS ─────────────────────────────────────────────────────────────────

export async function getSponsors(): Promise<SponsorEntry[]> {
  try {
    const res = await api.sponsors.get();
    if (res && Array.isArray(res.data)) {
      return res.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: s.type || s.sponsor_type || 'Partner',
        role: s.role || '',
        logoText: s.logo_text || s.logoText || '',
        logoUrl: s.logo_url || s.logoUrl || '',
        website: s.website || '',
        active: s.active ?? true,
        order: s.order ?? s.display_order ?? 0,
      }));
    }
  } catch (err) {
    console.warn('[contentService] getSponsors FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('sponsors').select('*').order('display_order', { ascending: true });
      if (!error && Array.isArray(data)) {
        return data.map((s: any) => ({
          id: s.id,
          name: s.name,
          type: s.sponsor_type || 'Partner',
          role: s.role || '',
          logoText: s.logo_text || '',
          logoUrl: s.logo_url || '',
          website: s.website || '',
          active: s.is_active ?? true,
          order: s.display_order ?? 0,
        }));
      }
    } catch (sErr) {
      console.warn('[contentService] getSponsors Supabase fallback error:', sErr);
    }
  }

  return [];
}

export async function addSponsor(s: Omit<SponsorEntry, 'id'>): Promise<SponsorEntry> {
  const payload = {
    name: s.name,
    type: s.type,
    role: s.role || '',
    logo_text: s.logoText || '',
    logo_url: s.logoUrl || '',
    website: s.website || '',
    active: s.active,
    order: s.order,
  };

  try {
    const res = await api.sponsors.create(payload);
    const data = res.data;
    return {
      id: data.id,
      name: data.name,
      type: data.type || data.sponsor_type || 'Partner',
      role: data.role || '',
      logoText: data.logo_text || data.logoText || '',
      logoUrl: data.logo_url || data.logoUrl || '',
      website: data.website || '',
      active: data.active ?? true,
      order: data.order ?? 0,
    };
  } catch (err) {
    console.warn('[contentService] addSponsor FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('sponsors').insert([{
        name: s.name,
        sponsor_type: s.type,
        role: s.role || '',
        logo_text: s.logoText || '',
        logo_url: s.logoUrl || '',
        website: s.website || '',
        is_active: s.active,
        display_order: s.order,
      }]).select('*');
      if (!error && data && data[0]) {
        return {
          id: data[0].id,
          name: data[0].name,
          type: data[0].sponsor_type || 'Partner',
          role: data[0].role || '',
          logoText: data[0].logo_text || '',
          logoUrl: data[0].logo_url || '',
          website: data[0].website || '',
          active: data[0].is_active ?? true,
          order: data[0].display_order ?? 0,
        };
      }
      throw new Error(`Database error: ${error?.message || 'Failed to insert'}`);
    }
    throw err;
  }
}

export async function updateSponsor(id: string, s: Partial<Omit<SponsorEntry, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (s.name !== undefined) payload.name = s.name;
  if (s.type !== undefined) {
    payload.type = s.type;
    payload.sponsor_type = s.type;
  }
  if (s.role !== undefined) payload.role = s.role;
  if (s.logoText !== undefined) payload.logo_text = s.logoText;
  if (s.logoUrl !== undefined) payload.logo_url = s.logoUrl;
  if (s.website !== undefined) payload.website = s.website;
  if (s.active !== undefined) {
    payload.active = s.active;
    payload.is_active = s.active;
  }
  if (s.order !== undefined) {
    payload.order = s.order;
    payload.display_order = s.order;
  }

  try {
    await api.sponsors.update(id, payload);
    return;
  } catch (err) {
    console.warn('[contentService] updateSponsor FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const supaPayload: Record<string, any> = {};
      if (s.name !== undefined) supaPayload.name = s.name;
      if (s.type !== undefined) supaPayload.sponsor_type = s.type;
      if (s.role !== undefined) supaPayload.role = s.role;
      if (s.logoText !== undefined) supaPayload.logo_text = s.logoText;
      if (s.logoUrl !== undefined) supaPayload.logo_url = s.logoUrl;
      if (s.website !== undefined) supaPayload.website = s.website;
      if (s.active !== undefined) supaPayload.is_active = s.active;
      if (s.order !== undefined) supaPayload.display_order = s.order;

      const { error } = await supabase.from('sponsors').update(supaPayload).eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function deleteSponsor(id: string): Promise<void> {
  try {
    await api.sponsors.delete(id);
    return;
  } catch (err) {
    console.warn('[contentService] deleteSponsor FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('sponsors').delete().eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function uploadSponsorLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    const res = await api.sponsors.uploadLogo(formData);
    if (res && res.url) {
      return res.url;
    }
  } catch (err) {
    console.warn('[contentService] uploadSponsorLogo FastAPI failed, attempting direct Supabase Storage:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `logo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('sponsor-logos')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(path);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    } catch (sErr: any) {
      console.error('[contentService] direct Supabase upload error:', sErr);
      throw new Error(sErr?.message || 'Failed to upload logo to storage.');
    }
  }

  throw new Error('Failed to upload logo. Please check backend connection.');
}

export async function deleteSponsorLogo(logoUrl: string): Promise<void> {
  if (!logoUrl) return;
  try {
    if (isSupabaseConfigured && supabase && logoUrl.includes('/sponsor-logos/')) {
      const parts = logoUrl.split('/sponsor-logos/');
      const filename = parts[1];
      if (filename) {
        await supabase.storage.from('sponsor-logos').remove([filename]);
      }
    }
  } catch (err) {
    console.warn('[contentService] deleteSponsorLogo cleanup warning:', err);
  }
}

// ─── Live Count Helpers ────────────────────────────────────────────────────────

export async function getDomainCount(): Promise<number> {
  const items = await getDomains();
  return items.filter((i) => i.active).length;
}

export async function getFaqCount(): Promise<number> {
  const items = await getFaqs();
  return items.filter((i) => i.active).length;
}

// ─── TESTIMONIALS / SHOWCASE ──────────────────────────────────────────────────

export const DEFAULT_TESTIMONIALS_FALLBACK: TestimonialEntry[] = [
  {
    id: 'testim-1',
    title: 'PRAGATHI Expo Inauguration',
    description: 'Guests, faculty members, and organizers gather at the PRAGATHI Project Expo entrance during the opening moments of the event.',
    personName: '',
    designation: 'Expo Inauguration',
    eventName: 'PRAGATHI Project Expo',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7326.JPG',
    imageAlt: 'PRAGATHI Expo Inauguration',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7326.JPG',
    thumbnailUrl: '/event-memories/IMG_7326.JPG',
    active: true,
    order: 1,
  },
  {
    id: 'testim-2',
    title: 'Guests Explore the Expo',
    description: 'Guests and faculty members walk through the exhibition area as project demonstrations begin.',
    personName: '',
    designation: 'Expo Walkthrough',
    eventName: 'Event Highlights',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7330.JPG',
    imageAlt: 'Guests Explore the Expo',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7330.JPG',
    thumbnailUrl: '/event-memories/IMG_7330.JPG',
    active: true,
    order: 2,
  },
  {
    id: 'testim-3',
    title: 'Young Innovator Presents a Project',
    description: 'A young participant explains a working project model to guests during the exhibition.',
    personName: '',
    designation: 'Project Demonstration',
    eventName: 'Student Innovation',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7363.JPG',
    imageAlt: 'Young Innovator Presents a Project',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7363.JPG',
    thumbnailUrl: '/event-memories/IMG_7363.JPG',
    active: true,
    order: 3,
  },
  {
    id: 'testim-4',
    title: 'Project Demonstration & Discussion',
    description: 'Students and guests discuss the working model during a project demonstration at the expo.',
    personName: '',
    designation: 'Project Showcase',
    eventName: 'Technical Interaction',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7368.JPG',
    imageAlt: 'Project Demonstration & Discussion',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7368.JPG',
    thumbnailUrl: '/event-memories/IMG_7368.JPG',
    active: true,
    order: 4,
  },
  {
    id: 'testim-5',
    title: 'Electric Mobility Prototype',
    description: 'Visitors and participants examine an electric mobility prototype displayed during the project exhibition.',
    personName: '',
    designation: 'Green Mobility',
    eventName: 'Prototype Showcase',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7377.JPG',
    imageAlt: 'Electric Mobility Prototype',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7377.JPG',
    thumbnailUrl: '/event-memories/IMG_7377.JPG',
    active: true,
    order: 5,
  },
  {
    id: 'testim-6',
    title: 'Drone Technology Demonstration',
    description: 'Students demonstrate a drone-based project while explaining its setup and operation to visitors.',
    personName: '',
    designation: 'Drone Technology',
    eventName: 'Project Demonstration',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7392.JPG',
    imageAlt: 'Drone Technology Demonstration',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7392.JPG',
    thumbnailUrl: '/event-memories/IMG_7392.JPG',
    active: true,
    order: 6,
  },
  {
    id: 'testim-7',
    title: 'Smart Agriculture Project',
    description: 'Students showcase an agriculture-focused project with crop samples, equipment, and supporting demonstrations.',
    personName: '',
    designation: 'Smart Agriculture',
    eventName: 'Project Showcase',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7441.JPG',
    imageAlt: 'Smart Agriculture Project',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7441.JPG',
    thumbnailUrl: '/event-memories/IMG_7441.JPG',
    active: true,
    order: 7,
  },
  {
    id: 'testim-8',
    title: 'Project Award Ceremony',
    description: 'Students celebrate their achievement as the project team receives recognition during the PRAGATHI Expo.',
    personName: '',
    designation: 'Achievement',
    eventName: 'Awards & Recognition',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7687.JPG',
    imageAlt: 'Project Award Ceremony',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7687.JPG',
    thumbnailUrl: '/event-memories/IMG_7687.JPG',
    active: true,
    order: 8,
  },
  {
    id: 'testim-9',
    title: 'Celebrating Student Achievement',
    description: 'Student teams receive certificates and recognition for their project work during the closing celebrations.',
    personName: '',
    designation: 'Student Achievement',
    eventName: 'Recognition Ceremony',
    eventYear: '2026',
    imageUrl: '/event-memories/IMG_7693.JPG',
    imageAlt: 'Celebrating Student Achievement',
    imageAspectRatio: '16:9',
    imagePosition: 'center',
    mediaType: 'image',
    mediaUrl: '/event-memories/IMG_7693.JPG',
    thumbnailUrl: '/event-memories/IMG_7693.JPG',
    active: true,
    order: 9,
  },
];

const EVENT_MEMORIES_IMAGES = [
  '/event-memories/IMG_7326.JPG',
  '/event-memories/IMG_7330.JPG',
  '/event-memories/IMG_7363.JPG',
  '/event-memories/IMG_7368.JPG',
  '/event-memories/IMG_7377.JPG',
  '/event-memories/IMG_7392.JPG',
  '/event-memories/IMG_7441.JPG',
  '/event-memories/IMG_7687.JPG',
  '/event-memories/IMG_7693.JPG',
];

function isDummyTestimonial(t: any): boolean {
  const title = (t.title || '').toLowerCase();
  const desc = (t.description || '').toLowerCase();
  const img = (t.media_url || t.image_url || t.imageUrl || '').toLowerCase();

  return (
    title.includes('jhsd') ||
    title.includes('grbt') ||
    title.includes('pragathi 2k25 – project expo showcase') ||
    title.includes('insd') ||
    desc.includes('jhsd') ||
    desc.includes('grbt') ||
    img.includes('unsplash.com') ||
    img.includes('placeholder')
  );
}

export async function getTestimonials(): Promise<TestimonialEntry[]> {
  try {
    const res = await api.testimonials.get();
    if (res && Array.isArray(res.data)) {
      const validItems = res.data.filter((t: any) => !isDummyTestimonial(t));
      if (validItems.length >= 9) {
        return validItems.map((t: any, idx: number) => {
          const rawUrl = t.media_url || t.image_url || t.imageUrl || '';
          const img = (!rawUrl || rawUrl.includes('unsplash.com')) ? EVENT_MEMORIES_IMAGES[idx % 9] : rawUrl;
          return {
            id: t.id,
            title: t.title || '',
            description: t.description || '',
            personName: t.person_name || t.personName || '',
            designation: t.designation || '',
            eventName: t.event_name || t.eventName || 'PRAGATHI Expo',
            eventYear: t.event_year || t.eventYear || '2026',
            imageUrl: img,
            imageAlt: t.image_alt || t.imageAlt || t.title || 'PRAGATHI Event Memory',
            imageAspectRatio: t.image_aspect_ratio || t.imageAspectRatio || '16:9',
            imagePosition: t.image_position || t.imagePosition || 'center',
            mediaType: t.media_type || t.mediaType || 'image',
            mediaUrl: img,
            thumbnailUrl: img,
            active: t.active ?? t.is_active ?? true,
            order: t.order ?? t.display_order ?? (idx + 1),
          };
        });
      }
    }
  } catch (err) {
    console.warn('[contentService] getTestimonials FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('testimonials').select('*').order('display_order', { ascending: true });
      if (data && Array.isArray(data)) {
        const validItems = data.filter((t: any) => !isDummyTestimonial(t));
        if (validItems.length >= 9) {
          return validItems.map((t: any, idx: number) => {
            const rawUrl = t.media_url || t.image_url || '';
            const img = (!rawUrl || rawUrl.includes('unsplash.com')) ? EVENT_MEMORIES_IMAGES[idx % 9] : rawUrl;
            return {
              id: t.id,
              title: t.title || '',
              description: t.description || '',
              personName: t.person_name || '',
              designation: t.designation || '',
              eventName: t.event_name || 'PRAGATHI Expo',
              eventYear: t.event_year || '2026',
              imageUrl: img,
              imageAlt: t.image_alt || t.title || 'PRAGATHI Event Memory',
              imageAspectRatio: t.image_aspect_ratio || '16:9',
              imagePosition: t.image_position || 'center',
              mediaType: t.media_type || 'image',
              mediaUrl: img,
              thumbnailUrl: img,
              active: t.is_active ?? true,
              order: t.display_order ?? (idx + 1),
            };
          });
        }
      }
    } catch (sErr) {
      console.warn('[contentService] getTestimonials Supabase fallback error:', sErr);
    }
  }

  return DEFAULT_TESTIMONIALS_FALLBACK;
}

export async function addTestimonial(t: Omit<TestimonialEntry, 'id'>): Promise<TestimonialEntry> {
  const payload = {
    title: t.title,
    description: t.description,
    person_name: t.personName || '',
    designation: t.designation,
    event_name: t.eventName,
    event_year: t.eventYear,
    image_url: t.imageUrl || t.mediaUrl || '',
    image_alt: t.imageAlt,
    image_aspect_ratio: t.imageAspectRatio,
    image_position: t.imagePosition,
    media_type: t.mediaType || 'image',
    media_url: t.mediaUrl || t.imageUrl || '',
    thumbnail_url: t.thumbnailUrl || t.imageUrl || '',
    is_active: t.active,
    display_order: t.order,
  };

  try {
    const res = await api.testimonials.create(payload);
    const data = res.data;
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      personName: data.person_name || '',
      designation: data.designation || '',
      eventName: data.event_name || '',
      eventYear: data.event_year || '',
      imageUrl: data.media_url || data.image_url || '',
      imageAlt: data.image_alt || '',
      imageAspectRatio: data.image_aspect_ratio || '16:9',
      imagePosition: data.image_position || 'center',
      mediaType: data.media_type || 'image',
      mediaUrl: data.media_url || data.image_url || '',
      thumbnailUrl: data.thumbnail_url || data.image_url || '',
      active: data.is_active ?? true,
      order: data.display_order ?? 0,
    };
  } catch (err) {
    console.warn('[contentService] addTestimonial fallback:', err);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('testimonials').insert([payload]).select('*');
      if (!error && data && data[0]) {
        return {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description || '',
          personName: data[0].person_name || '',
          designation: data[0].designation || '',
          eventName: data[0].event_name || '',
          eventYear: data[0].event_year || '',
          imageUrl: data[0].media_url || data[0].image_url || '',
          imageAlt: data[0].image_alt || '',
          imageAspectRatio: data[0].image_aspect_ratio || '16:9',
          imagePosition: data[0].image_position || 'center',
          mediaType: data[0].media_type || 'image',
          mediaUrl: data[0].media_url || data[0].image_url || '',
          thumbnailUrl: data[0].thumbnail_url || data[0].image_url || '',
          active: data[0].is_active ?? true,
          order: data[0].display_order ?? 0,
        };
      }
    }
    throw err;
  }
}

export async function updateTestimonial(id: string, t: Partial<Omit<TestimonialEntry, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (t.title !== undefined) payload.title = t.title;
  if (t.description !== undefined) payload.description = t.description;
  if (t.personName !== undefined) payload.person_name = t.personName;
  if (t.designation !== undefined) payload.designation = t.designation;
  if (t.eventName !== undefined) payload.event_name = t.eventName;
  if (t.eventYear !== undefined) payload.event_year = t.eventYear;
  if (t.imageUrl !== undefined) payload.image_url = t.imageUrl;
  if (t.imageAlt !== undefined) payload.image_alt = t.imageAlt;
  if (t.imageAspectRatio !== undefined) payload.image_aspect_ratio = t.imageAspectRatio;
  if (t.imagePosition !== undefined) payload.image_position = t.imagePosition;
  if (t.mediaType !== undefined) payload.media_type = t.mediaType;
  if (t.mediaUrl !== undefined) payload.media_url = t.mediaUrl;
  if (t.thumbnailUrl !== undefined) payload.thumbnail_url = t.thumbnailUrl;
  if (t.active !== undefined) payload.is_active = t.active;
  if (t.order !== undefined) payload.display_order = t.order;

  try {
    await api.testimonials.update(id, payload);
    return;
  } catch (err) {
    console.warn('[contentService] updateTestimonial FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function deleteTestimonial(id: string): Promise<void> {
  try {
    await api.testimonials.delete(id);
    return;
  } catch (err) {
    console.warn('[contentService] deleteTestimonial FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

// ─── CONTACT PEOPLE (Leadership & Coordinators) ───────────────────────────────

export interface ContactPerson {
  id: string;
  category: 'leadership' | 'coordinator';
  name: string;
  designation: string;
  mobile: string;
  email?: string;
  order: number;
  active: boolean;
}

export const DEFAULT_CONTACT_PEOPLE: ContactPerson[] = [
  {
    id: 'cp-lead-1',
    category: 'leadership',
    name: 'Dr. CH. Hussaian Basha',
    designation: 'Dean-Project Show Case',
    mobile: '9514418276',
    email: 'dean.psc@sru.edu.in',
    order: 1,
    active: true,
  },
  {
    id: 'cp-lead-2',
    category: 'leadership',
    name: 'Dr. Markala Karthik Reddy',
    designation: 'Associate Dean Project Show Case',
    mobile: '7842227172',
    email: 'm.karthik@sru.edu.in',
    order: 2,
    active: true,
  },
  {
    id: 'cp-lead-3',
    category: 'leadership',
    name: 'Dr. Shravan Kumar Yadav',
    designation: 'Associate Dean Project Show Case',
    mobile: '9040316409',
    email: 'shravan.kumar@sru.edu.in',
    order: 3,
    active: true,
  },
  {
    id: 'cp-coord-1',
    category: 'coordinator',
    name: 'Mr. Mohammad Afzal',
    designation: 'Coordinator',
    mobile: '9100726799',
    email: '',
    order: 1,
    active: true,
  },
  {
    id: 'cp-coord-2',
    category: 'coordinator',
    name: 'Mr. Algol Sumanth',
    designation: 'Coordinator',
    mobile: '7842421505',
    email: '',
    order: 2,
    active: true,
  },
];

export async function getContactPeople(): Promise<ContactPerson[]> {
  try {
    const res = await api.contact.getPeople();
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((r: any) => ({
        id: String(r.id),
        category: (r.category === 'coordinator' ? 'coordinator' : 'leadership') as 'leadership' | 'coordinator',
        name: r.name || '',
        designation: r.designation || '',
        mobile: r.mobile || '',
        email: r.email || '',
        order: r.display_order ?? r.order ?? 1,
        active: r.is_active ?? r.active ?? true,
      }));
    }
  } catch (err) {
    console.warn('[contentService] getContactPeople FastAPI fallback:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('contact_people')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: String(r.id),
          category: (r.category === 'coordinator' ? 'coordinator' : 'leadership') as 'leadership' | 'coordinator',
          name: r.name || '',
          designation: r.designation || '',
          mobile: r.mobile || '',
          email: r.email || '',
          order: r.display_order ?? 1,
          active: r.is_active ?? true,
        }));
      }
    } catch (sErr) {
      console.warn('[contentService] getContactPeople Supabase fallback error:', sErr);
    }
  }

  return DEFAULT_CONTACT_PEOPLE;
}

export async function createContactPerson(person: Omit<ContactPerson, 'id'>): Promise<ContactPerson> {
  const payload = {
    category: person.category,
    name: person.name,
    designation: person.designation,
    mobile: person.mobile,
    email: person.email || '',
    display_order: person.order,
    is_active: person.active,
  };

  try {
    const res = await api.contact.createPerson(payload);
    if (res && res.data) {
      return {
        id: String(res.data.id),
        category: res.data.category,
        name: res.data.name,
        designation: res.data.designation,
        mobile: res.data.mobile,
        email: res.data.email || '',
        order: res.data.display_order ?? res.data.order ?? 1,
        active: res.data.is_active ?? res.data.active ?? true,
      };
    }
  } catch (err) {
    console.warn('[contentService] createContactPerson FastAPI failed, attempting Supabase direct:', err);
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('contact_people').insert([payload]).select().single();
    if (!error && data) {
      return {
        id: String(data.id),
        category: data.category,
        name: data.name,
        designation: data.designation,
        mobile: data.mobile,
        email: data.email || '',
        order: data.display_order ?? 1,
        active: data.is_active ?? true,
      };
    }
    if (error) throw new Error(`Database error: ${error.message}`);
  }

  return {
    id: `cp-${Date.now()}`,
    ...person,
  };
}

export async function updateContactPerson(id: string, person: Partial<Omit<ContactPerson, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (person.category !== undefined) payload.category = person.category;
  if (person.name !== undefined) payload.name = person.name;
  if (person.designation !== undefined) payload.designation = person.designation;
  if (person.mobile !== undefined) payload.mobile = person.mobile;
  if (person.email !== undefined) payload.email = person.email;
  if (person.order !== undefined) payload.display_order = person.order;
  if (person.active !== undefined) payload.is_active = person.active;

  try {
    await api.contact.updatePerson(id, payload);
    return;
  } catch (err) {
    console.warn('[contentService] updateContactPerson FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('contact_people').update(payload).eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}

export async function deleteContactPerson(id: string): Promise<void> {
  try {
    await api.contact.deletePerson(id);
    return;
  } catch (err) {
    console.warn('[contentService] deleteContactPerson FastAPI failed, attempting Supabase direct:', err);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('contact_people').delete().eq('id', id);
      if (!error) return;
      throw new Error(`Database error: ${error.message}`);
    }
    throw err;
  }
}
