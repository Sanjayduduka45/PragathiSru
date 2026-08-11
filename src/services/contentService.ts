/**
 * contentService.ts
 *
 * Single source of truth for ALL content CRUD operations in React.
 * Every admin page and every public page goes through this service,
 * which routes calls to the FastAPI Python Backend (`api.*` from `./api.ts`).
 */

import { api } from './api';
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
  website: string;
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
      };
    }
  } catch (err) {
    console.warn('[contentService] getEventSettings backend fallback:', err);
  }
  return DEFAULT_SITE_SETTINGS;
}

export async function updateEventSettings(settings: Partial<SiteSettings>): Promise<void> {
  const payload = {
    event_name: settings.eventName,
    full_title: settings.fullTitle,
    tagline: settings.tagline,
    event_date: settings.eventDate,
    target_date_iso: settings.targetDateISO,
    venue: settings.venue,
    institution: settings.institution,
    location: settings.location,
    prize_pool: settings.prizePool,
    contact_email: settings.contactEmail,
    helpline: settings.helpline,
  };
  await api.event.update(payload);
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
    console.warn('[contentService] getAboutContent backend fallback:', err);
  }
  return DEFAULT_ABOUT;
}

export async function updateAboutContent(content: AboutContent): Promise<void> {
  await api.about.update(content);
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
    console.warn('[contentService] getDomains backend fallback:', err);
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

  await api.domains.update(id, payload);
}

export async function deleteDomain(id: string): Promise<void> {
  await api.domains.delete(id);
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
    console.warn('[contentService] getScheduleItems backend fallback:', err);
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
}

export async function updateScheduleItem(id: string, s: Partial<Omit<ScheduleEntry, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (s.time !== undefined) payload.time = s.time;
  if (s.event !== undefined) payload.event = s.event;
  if (s.location !== undefined) payload.location = s.location;
  if (s.description !== undefined) payload.description = s.description;
  if (s.badge !== undefined) payload.badge = s.badge;
  if (s.active !== undefined) payload.active = s.active;
  if (s.displayOrder !== undefined) payload.display_order = s.displayOrder;

  await api.schedule.update(id, payload);
}

export async function deleteScheduleItem(id: string): Promise<void> {
  await api.schedule.delete(id);
}

// ─── RULES CONTENT ────────────────────────────────────────────────────────────

export async function getRulesContent(): Promise<string> {
  try {
    const res = await api.rules.get();
    if (res && res.data && res.data.content) {
      return res.data.content;
    }
  } catch (err) {
    console.warn('[contentService] getRulesContent backend fallback:', err);
  }
  return DEFAULT_RULES;
}

export async function updateRulesContent(content: string): Promise<void> {
  await api.rules.update({ content });
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
    console.warn('[contentService] getFaqs backend fallback:', err);
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
}

export async function updateFaq(id: string, f: Partial<Omit<FAQEntry, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (f.question !== undefined) payload.question = f.question;
  if (f.answer !== undefined) payload.answer = f.answer;
  if (f.category !== undefined) payload.category = f.category;
  if (f.active !== undefined) payload.active = f.active;
  if (f.order !== undefined) payload.order = f.order;

  await api.faqs.update(id, payload);
}

export async function deleteFaq(id: string): Promise<void> {
  await api.faqs.delete(id);
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
        website: s.website || '',
        active: s.active ?? true,
        order: s.order ?? s.display_order ?? 0,
      }));
    }
  } catch (err) {
    console.warn('[contentService] getSponsors backend fallback:', err);
  }
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

export async function addSponsor(s: Omit<SponsorEntry, 'id'>): Promise<SponsorEntry> {
  const payload = {
    name: s.name,
    type: s.type,
    role: s.role,
    logo_text: s.logoText,
    website: s.website,
    active: s.active,
    order: s.order,
  };
  const res = await api.sponsors.create(payload);
  const data = res.data;
  return {
    id: data.id,
    name: data.name,
    type: data.type || data.sponsor_type || 'Partner',
    role: data.role || '',
    logoText: data.logo_text || data.logoText || '',
    website: data.website || '',
    active: data.active ?? true,
    order: data.order ?? 0,
  };
}

export async function updateSponsor(id: string, s: Partial<Omit<SponsorEntry, 'id'>>): Promise<void> {
  const payload: Record<string, any> = {};
  if (s.name !== undefined) payload.name = s.name;
  if (s.type !== undefined) payload.type = s.type;
  if (s.role !== undefined) payload.role = s.role;
  if (s.logoText !== undefined) payload.logo_text = s.logoText;
  if (s.website !== undefined) payload.website = s.website;
  if (s.active !== undefined) payload.active = s.active;
  if (s.order !== undefined) payload.order = s.order;

  await api.sponsors.update(id, payload);
}

export async function deleteSponsor(id: string): Promise<void> {
  await api.sponsors.delete(id);
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
