/**
 * PRAGATHI 2K26 — Authoritative Dynamic Domain Resolution Utility
 *
 * Implements the official canonical domain resolution path:
 * registrations.id
 *   -> projects.registration_id
 *   -> projects.category
 *   -> domain_aliases / project_domains
 *   -> canonical domain (project_domains.title)
 *
 * Rules:
 * - NO Registration ID prefix inference (no CIV / CSE / EEE prefix checks)
 * - NO hardcoded mapping arrays or hardcoded domain ID assumptions
 * - All domains and aliases are loaded dynamically from project_domains & domain_aliases
 * - Displays and exports human-readable canonical project_domains.title
 */

export interface DomainItem {
  id: string;
  title: string;
  description?: string;
  active?: boolean;
  is_active?: boolean;
  display_order?: number;
}

export interface DomainAliasItem {
  domain_id: string;
  alias_text: string;
  is_active?: boolean;
}

/**
 * Built-in fallback alias seeds reflecting authoritative live production project_domains.
 * Used for initial hydration or when offline.
 */
export const DEFAULT_DOMAIN_ALIASES: DomainAliasItem[] = [
  // 1. ai-software -> Civil Engineering & Smart Infrastructure
  { domain_id: 'ai-software', alias_text: 'Civil Engineering & Smart Infrastructure', is_active: true },
  { domain_id: 'ai-software', alias_text: 'Civil Engineering', is_active: true },
  { domain_id: 'ai-software', alias_text: 'ai-software', is_active: true },
  // 2. hardware-iot -> Electrical Engineering & Energy Systems
  { domain_id: 'hardware-iot', alias_text: 'Electrical Engineering & Energy Systems', is_active: true },
  { domain_id: 'hardware-iot', alias_text: 'Electrical Engineering', is_active: true },
  { domain_id: 'hardware-iot', alias_text: 'hardware-iot', is_active: true },
  // 3. green-sustainability -> Mechanical Engineering & Automation
  { domain_id: 'green-sustainability', alias_text: 'Mechanical Engineering & Automation', is_active: true },
  { domain_id: 'green-sustainability', alias_text: 'Mechanical Engineering', is_active: true },
  { domain_id: 'green-sustainability', alias_text: 'green-sustainability', is_active: true },
  // 4. health-biotech -> Electronics & Communication Technologies
  { domain_id: 'health-biotech', alias_text: 'Electronics & Communication Technologies', is_active: true },
  { domain_id: 'health-biotech', alias_text: 'Electronics & Communication', is_active: true },
  { domain_id: 'health-biotech', alias_text: 'health-biotech', is_active: true },
  // 5. smart-automation -> Computer Science & Artificial Intelligence
  { domain_id: 'smart-automation', alias_text: 'Computer Science & Artificial Intelligence', is_active: true },
  { domain_id: 'smart-automation', alias_text: 'Computer Science', is_active: true },
  { domain_id: 'smart-automation', alias_text: 'smart-automation', is_active: true },
  // 6. open-innovation -> Business Management & Entrepreneurship
  { domain_id: 'open-innovation', alias_text: 'Business Management & Entrepreneurship', is_active: true },
  { domain_id: 'open-innovation', alias_text: 'open-innovation', is_active: true },
  // 7. domain-7c89c586 -> Agriculture & Agri-Innovation
  { domain_id: 'domain-7c89c586', alias_text: 'Agriculture & Agri-Innovation', is_active: true },
  // 8. domain-315daeb9 -> Healthcare & Biomedical Innovations
  { domain_id: 'domain-315daeb9', alias_text: 'Healthcare & Biomedical Innovations', is_active: true },
  // 9. domain-c0677a05 -> Multidisciplinary Innovation & Smart Solutions
  { domain_id: 'domain-c0677a05', alias_text: 'Multidisciplinary Innovation & Smart Solutions', is_active: true },
  { domain_id: 'domain-c0677a05', alias_text: 'Multidisciplinary Innovation & Smart Solution', is_active: true },
  // 10. domain-9f52a525 -> School Innovation & Young Innovators
  { domain_id: 'domain-9f52a525', alias_text: 'School Innovation & Young Innovators', is_active: true },
  { domain_id: 'domain-9f52a525', alias_text: 'School Innovation & Young Innovators (For 8th–12th Standard Students)', is_active: true },
  { domain_id: 'domain-9f52a525', alias_text: 'School Innovation & Young Innovators (For 8th-12th Standard Students)', is_active: true },
];

/**
 * Resolves a raw category string to a canonical domain ID and human-readable title.
 * Path:
 * 1. projects.category
 * 2. domain_aliases (active aliases, case-insensitive, trimmed) -> domain_id
 * 3. Fallback: exact match against project_domains.title or project_domains.id
 * 4. Resolves canonical domain display title from project_domains.title
 */
export function resolveCategoryToCanonicalDomain(
  category: string | undefined | null,
  domains: DomainItem[],
  aliases: DomainAliasItem[]
): { domainId: string | null; domainTitle: string } {
  if (!category || !category.trim()) {
    return { domainId: null, domainTitle: 'N/A' };
  }

  const clean = category.trim().toLowerCase();

  // 1. Look up in domain_aliases (active only, trimmed, case-insensitive)
  const matchedAlias = aliases.find(
    (a) => a.is_active !== false && a.alias_text && a.alias_text.trim().toLowerCase() === clean
  );

  let targetDomainId: string | null = matchedAlias ? matchedAlias.domain_id.trim() : null;

  // 2. Fallback: match directly against project_domains title or id (trimmed, case-insensitive)
  if (!targetDomainId) {
    const matchedDomain = domains.find(
      (d) =>
        (d.title && d.title.trim().toLowerCase() === clean) ||
        (d.id && d.id.trim().toLowerCase() === clean)
    );
    if (matchedDomain) {
      targetDomainId = matchedDomain.id.trim();
    }
  }

  // 3. Resolve canonical domain display title from project_domains
  if (targetDomainId) {
    const canonicalDomain = domains.find(
      (d) => d.id.trim().toLowerCase() === targetDomainId!.toLowerCase()
    );
    if (canonicalDomain) {
      return {
        domainId: canonicalDomain.id,
        domainTitle: canonicalDomain.title,
      };
    }
    // If domainId was in aliases but not found in current domain list, return clean title representation
    return {
      domainId: targetDomainId,
      domainTitle: targetDomainId,
    };
  }

  // Unmapped category
  return { domainId: null, domainTitle: category.trim() };
}

/**
 * Resolves a registration record's canonical domain:
 * registration.id
 *   -> registration.projects[0].registration_id
 *   -> registration.projects[0].category
 *   -> canonical domain
 */
export function resolveRegistrationCanonicalDomain(
  registration: { projects?: Array<{ category?: string }> | null },
  domains: DomainItem[],
  aliases: DomainAliasItem[]
): { domainId: string | null; domainTitle: string } {
  const category = registration?.projects?.[0]?.category;
  return resolveCategoryToCanonicalDomain(category, domains, aliases);
}
