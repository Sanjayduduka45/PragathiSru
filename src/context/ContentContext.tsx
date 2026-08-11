/**
 * ContentContext.tsx
 *
 * Provides all dynamic site content to the PUBLIC application.
 * Data is fetched from Supabase on mount and falls back to hardcoded
 * defaults when Supabase is not configured, so the public site always works.
 *
 * Admin pages DO NOT use this context — they call contentService directly
 * and refresh their own local state after each mutation.
 *
 * Usage in public components:
 *   const { eventSettings, domains, faqs, ... } = useContent();
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getEventSettings,
  getAboutContent,
  getDomains,
  getScheduleItems,
  getRulesContent,
  getFaqs,
  getSponsors,
  type SiteSettings,
  type AboutContent,
  type DomainItem,
  type ScheduleEntry,
  type FAQEntry,
  type SponsorEntry,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_ABOUT,
} from '../services/contentService';
import {
  PROJECT_CATEGORIES,
  SCHEDULE_PREVIEW,
  FAQS,
  SPONSORS_PARTNERS,
} from '../data/eventData';

// ─── Context Shape ─────────────────────────────────────────────────────────────

interface ContentContextValue {
  eventSettings: SiteSettings;
  aboutContent: AboutContent;
  domains: DomainItem[];
  schedule: ScheduleEntry[];
  rules: string;
  faqs: FAQEntry[];
  sponsors: SponsorEntry[];
  contentLoading: boolean;
  /** Call after an admin save to force public data to re-fetch */
  refreshContent: () => Promise<void>;
}

// ─── Default Values (used before first fetch completes) ────────────────────────

const defaultDomains: DomainItem[] = PROJECT_CATEGORIES.map((c, i) => ({
  id: c.id,
  title: c.title,
  description: c.description,
  iconName: c.iconName,
  color: c.color,
  badgeText: c.badgeText,
  active: true,
  displayOrder: i + 1,
}));

const defaultSchedule: ScheduleEntry[] = SCHEDULE_PREVIEW.map((s, i) => ({
  id: `sch-${i}`,
  time: s.time,
  event: s.event,
  location: s.location,
  description: s.description,
  badge: s.badge,
  active: true,
  displayOrder: i + 1,
}));

const defaultFaqs: FAQEntry[] = FAQS.map((f, i) => ({
  id: f.id,
  question: f.question,
  answer: f.answer,
  category: f.category,
  active: true,
  order: i + 1,
}));

const defaultSponsors: SponsorEntry[] = SPONSORS_PARTNERS.map((s, i) => ({
  id: `sponsor-${i}`,
  name: s.name,
  type: s.type,
  role: s.role,
  logoText: s.logoText,
  website: '',
  active: true,
  order: i + 1,
}));

// ─── Context ───────────────────────────────────────────────────────────────────

const ContentContext = createContext<ContentContextValue>({
  eventSettings: DEFAULT_SITE_SETTINGS,
  aboutContent: DEFAULT_ABOUT,
  domains: defaultDomains,
  schedule: defaultSchedule,
  rules: '',
  faqs: defaultFaqs,
  sponsors: defaultSponsors,
  contentLoading: false,
  refreshContent: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [eventSettings, setEventSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [aboutContent, setAboutContent] = useState<AboutContent>(DEFAULT_ABOUT);
  const [domains, setDomains] = useState<DomainItem[]>(defaultDomains);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(defaultSchedule);
  const [rules, setRules] = useState<string>('');
  const [faqs, setFaqs] = useState<FAQEntry[]>(defaultFaqs);
  const [sponsors, setSponsors] = useState<SponsorEntry[]>(defaultSponsors);
  const [contentLoading, setContentLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setContentLoading(true);
    try {
      const [
        settingsData,
        aboutData,
        domainsData,
        scheduleData,
        rulesData,
        faqsData,
        sponsorsData,
      ] = await Promise.all([
        getEventSettings(),
        getAboutContent(),
        getDomains(),
        getScheduleItems(),
        getRulesContent(),
        getFaqs(),
        getSponsors(),
      ]);

      setEventSettings(settingsData);
      setAboutContent(aboutData);
      setDomains(domainsData);
      setSchedule(scheduleData);
      setRules(rulesData);
      setFaqs(faqsData);
      setSponsors(sponsorsData);
    } catch (err) {
      console.error('[ContentContext] Failed to fetch content:', err);
      // Keep defaults on error
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <ContentContext.Provider
      value={{
        eventSettings,
        aboutContent,
        domains,
        schedule,
        rules,
        faqs,
        sponsors,
        contentLoading,
        refreshContent: fetchAll,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useContent = (): ContentContextValue => useContext(ContentContext);
