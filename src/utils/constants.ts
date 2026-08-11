export const EVENT_DETAILS = {
  name: 'PRAGATHI 2K26',
  fullTitle: 'PRAGATHI 2K26 — National Level Project Expo',
  tagline: 'Innovate. Create. Inspire.',
  institution: 'SR University',
  location: 'Warangal, Telangana',
  venue: 'SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371',
  eventDate: '09 October 2026',
  targetDateISO: '2026-10-09T09:00:00+05:30',
  prizePool: '₹1,50,000',
  teamSize: '1–5 Members',
  eligibility: 'Open to School & College Students',
  sruDomain: 'sru.edu.in',
  contactEmail: 'pragathi2k26@sru.edu.in',
  helpline: '+91 870 281 8333',
};

export interface NavItem {
  label: string;
  path: string;
  isFuture?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Domains', path: '/#categories' },
  { label: 'Schedule', path: '/#schedule' },
  { label: 'Rules', path: '/about#rules' },
  { label: 'FAQs', path: '/#faq' },
  { label: 'Testimonials', path: '/testimonials' },
  { label: 'Contact', path: '/contact' },
];

export const FUTURE_MODULES = [
  { id: 'dashboard', name: 'Participant Dashboard', description: 'Manage project submissions, team profiles, and approval status.' },
  { id: 'projects', name: 'Explore Projects', description: 'Interactive national directory of submitted projects across all tracks.' },
  { id: 'categories', name: 'Categories', description: 'Detailed domain guidelines and project track breakdowns.' },
  { id: 'schedule', name: 'Schedule', description: 'Full Expo Day timeline, speaker sessions, and judging hours.' },
  { id: 'rules', name: 'Rules & Guidelines', description: 'Official participation handbook, poster standards, and evaluation criteria.' },
  { id: 'faq', name: 'FAQs', description: 'Comprehensive help center for registration, venue, and stall allocation.' },
  { id: 'contact', name: 'Contact', description: 'Official helpline numbers, faculty coordinators, and student volunteer team.' },
  { id: 'judge', name: 'Judge Portal', description: 'Jury scorecards, real-time evaluation sheets, and feedback portal.' },
  { id: 'admin', name: 'Management Portal', description: 'Admin control center for event organizers, check-in desks, and stall management.' },
  { id: 'poster', name: 'Poster Center', description: 'Standardized digital poster generator and submission portal.' },
  { id: 'results', name: 'Results', description: 'Live category winner announcements and merit list leaderboard.' },
  { id: 'certificates', name: 'Certificates', description: 'Official verifiable e-certificates for participation and merit.' },
  { id: 'login', name: 'Login Portal', description: 'Participant, judge, and volunteer authentication desk.' },
];
