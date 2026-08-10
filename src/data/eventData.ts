export interface ProjectCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  badgeText: string;
}

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  {
    id: 'ai-software',
    title: 'Software, AI & Data Science',
    description: 'Web & mobile applications, Machine Learning models, GenAI solutions, Cloud & Cybersecurity prototypes.',
    iconName: 'Cpu',
    color: 'from-blue-600 to-indigo-600',
    badgeText: 'Software Track',
  },
  {
    id: 'hardware-iot',
    title: 'Hardware, IoT & Embedded Systems',
    description: 'Smart devices, sensor networks, robotics, drone tech, microcontrollers, and Industry 4.0 automation.',
    iconName: 'Zap',
    color: 'from-cyan-600 to-blue-700',
    badgeText: 'Hardware Track',
  },
  {
    id: 'green-sustainability',
    title: 'Green Energy & Environmental Tech',
    description: 'Renewable energy systems, waste management, electric mobility, agricultural innovations, and eco-tech.',
    iconName: 'Leaf',
    color: 'from-emerald-600 to-teal-700',
    badgeText: 'Sustainability Track',
  },
  {
    id: 'health-biotech',
    title: 'Healthcare, MedTech & BioTech',
    description: 'Diagnostic devices, biomedical instruments, health tracking software, and bio-inspired engineering.',
    iconName: 'HeartPulse',
    color: 'from-rose-600 to-pink-700',
    badgeText: 'Health Tech Track',
  },
  {
    id: 'smart-automation',
    title: 'Smart Cities & Automation',
    description: 'Urban mobility, traffic management, smart grid systems, water management, and public safety tech.',
    iconName: 'Building2',
    color: 'from-amber-600 to-orange-700',
    badgeText: 'Civic Tech Track',
  },
  {
    id: 'open-innovation',
    title: 'Open Innovation & Social Tech',
    description: 'Cross-disciplinary ideas, assistive tech for accessibility, educational tools, and high-impact social prototypes.',
    iconName: 'Lightbulb',
    color: 'from-blue-700 to-sky-600',
    badgeText: 'Open Track',
  },
];

export interface ExpoHighlight {
  title: string;
  value: string;
  label: string;
  description: string;
}

export const EXPO_HIGHLIGHTS: ExpoHighlight[] = [
  {
    title: 'Grand Cash Prizes',
    value: '₹1,50,000',
    label: 'Total Prize Pool',
    description: 'Recognizing top innovative projects across multiple domain tracks.',
  },
  {
    title: 'National Scope',
    value: '500+',
    label: 'Expected Projects',
    description: 'Representing schools, polytechnics, and engineering colleges nationwide.',
  },
  {
    title: 'Participant Certificates',
    value: '100%',
    label: 'Certified Participants',
    description: 'Every presenting team receives official digital and hardcopy certificates.',
  },
  {
    title: 'Industry Evaluation',
    value: '50+',
    label: 'Expert Judges & Mentors',
    description: 'Evaluated by seasoned academicians, scientists, and industry leaders.',
  },
];

export interface ImportantDate {
  date: string;
  title: string;
  subtitle: string;
  status: 'active' | 'upcoming' | 'completed';
}

export const IMPORTANT_DATES: ImportantDate[] = [
  {
    date: '01 September 2026',
    title: 'Portal Registrations Open',
    subtitle: 'Online portal opens for SRU and external team abstract submissions.',
    status: 'active',
  },
  {
    date: '25 September 2026',
    title: 'Abstract Submission Deadline',
    subtitle: 'Final date to submit project abstract, technology stack, and team details.',
    status: 'upcoming',
  },
  {
    date: '02 October 2026',
    title: 'Shortlist Announcement',
    subtitle: 'Notification sent to shortlisted teams along with stall allocation details.',
    status: 'upcoming',
  },
  {
    date: '09 October 2026',
    title: 'PRAGATHI 2K26 Expo Day',
    subtitle: 'National Level Exhibition, live judging, and grand valedictory ceremony at SR University campus.',
    status: 'upcoming',
  },
];

export interface ScheduleItem {
  time: string;
  event: string;
  location: string;
  description: string;
  badge: string;
}

export const SCHEDULE_PREVIEW: ScheduleItem[] = [
  {
    time: '08:30 AM – 09:30 AM',
    event: 'On-site Registration & Stall Setup',
    location: 'SR University Expo Pavilion',
    description: 'Teams report to check-in counters, receive stall badges, and set up project displays.',
    badge: 'Check-In',
  },
  {
    time: '09:30 AM – 10:15 AM',
    event: 'Grand Inauguration Ceremony',
    location: 'Main University Auditorium',
    description: 'Inaugural address by SR University Dignitaries, Chief Guests, and Industry Mentors.',
    badge: 'Inauguration',
  },
  {
    time: '10:30 AM – 01:30 PM',
    event: 'Jury Evaluation Phase I & Demonstration',
    location: 'Expo Halls A, B & C',
    description: 'Expert panel evaluates working prototypes, code bases, and technical poster presentations.',
    badge: 'Evaluation',
  },
  {
    time: '01:30 PM – 02:30 PM',
    event: 'Lunch & Networking Break',
    location: 'University Food Court & Student Center',
    description: 'Networking lunch for participants, judges, faculty mentors, and visiting delegates.',
    badge: 'Networking',
  },
  {
    time: '02:30 PM – 04:00 PM',
    event: 'Public Exhibition & Final Judging',
    location: 'Expo Pavilion',
    description: 'Open viewing for students, school delegations, industry representatives, and final round reviews.',
    badge: 'Open Expo',
  },
  {
    time: '04:15 PM – 05:30 PM',
    event: 'Valedictory & Award Ceremony',
    location: 'Main Auditorium',
    description: 'Announcement of category winners, prize distribution (₹1,50,000 pool), and closing remarks.',
    badge: 'Awards',
  },
];

export interface FeaturedProject {
  id: string;
  title: string;
  category: string;
  teamName: string;
  institution: string;
  abstract: string;
  badge: string;
  membersCount: number;
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'proj-1',
    title: 'Autonomous Precision Drone for Crop Health',
    category: 'Hardware & IoT',
    teamName: 'AgriTech Vision',
    institution: 'School of Electrical Engineering, SRU',
    abstract: 'Multispectral sensor drone mapping crop stress and automated localized micro-fertilizer delivery.',
    badge: 'Shortlisted Entry',
    membersCount: 4,
  },
  {
    id: 'proj-2',
    title: 'AI Diagnostic Assistant for Rural Healthcare',
    category: 'Software & AI',
    teamName: 'Neural Care',
    institution: 'Department of AI & Data Science, SRU',
    abstract: 'Low-latency mobile medical diagnosis model operating offline for primary health centers.',
    badge: 'Shortlisted Entry',
    membersCount: 3,
  },
  {
    id: 'proj-3',
    title: 'Bio-Degradable Waste to Power System',
    category: 'Green Sustainability',
    teamName: 'EcoSpark Innovators',
    institution: 'School of Sciences & BioTech, SRU',
    abstract: 'Compact microbial fuel cell converting canteen organic waste into renewable electricity for campus sensors.',
    badge: 'Shortlisted Entry',
    membersCount: 5,
  },
];

export interface SponsorPartner {
  name: string;
  type: string;
  role: string;
  logoText: string;
}

export const SPONSORS_PARTNERS: SponsorPartner[] = [
  {
    name: 'SRiX Incubator',
    type: 'Incubation Partner',
    role: 'Startup Seed Grants & Mentorship',
    logoText: 'SRiX',
  },
  {
    name: 'Institution’s Innovation Council (IIC)',
    type: 'Government Partner',
    role: 'Ministry of Education Initiative',
    logoText: 'MIC IIC',
  },
  {
    name: 'IEEE SRU Student Branch',
    type: 'Technical Partner',
    role: 'Technical Quality & Standards',
    logoText: 'IEEE',
  },
  {
    name: 'SR University R&D Cell',
    type: 'Academic Sponsor',
    role: 'Research & Prototyping Support',
    logoText: 'SRU R&D',
  },
];

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  institution: string;
  quote: string;
  projectTitle: string;
  award: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Ananya Rao',
    role: 'Team Lead',
    institution: 'School of Computer Science, SR University',
    quote: 'PRAGATHI gave our team the platform to present our AI Agriculture sensor prototype to industry mentors. The feedback helped us convert our project into a patent-pending startup!',
    projectTitle: 'AgriSense IoT',
    award: 'Best Innovation Winner (PRAGATHI 2025)',
  },
  {
    id: '2',
    name: 'K. Vikram Reddy',
    role: 'Student Researcher',
    institution: 'National Institute of Technology, Warangal',
    quote: 'Organizing and infrastructure at SR University Warangal was top tier. The exhibition stalls, judge interaction, and seamless digital management made it a memorable experience.',
    projectTitle: 'Smart Grid Load Balancer',
    award: '1st Runner Up - Hardware Category',
  },
  {
    id: '3',
    name: 'Dr. P. Srinivas',
    role: 'Innovation & Incubation Coordinator',
    institution: 'SR University, Warangal',
    quote: 'PRAGATHI 2K26 is designed to foster a culture of creative problem solving, cross-disciplinary collaboration, and real-world engineering impact among young minds.',
    projectTitle: 'Faculty Convener',
    award: 'SR University Innovation Council',
  },
];

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Registration' | 'General' | 'Expo Rules';
}

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Who is eligible to participate in PRAGATHI 2K26?',
    answer: 'PRAGATHI 2K26 is a National Level Expo open to both School students (Classes 8–12) and College/University students (Diploma, B.Tech, M.Tech, Degree, B.Sc) from recognized institutions across India.',
    category: 'Registration',
  },
  {
    id: 'faq-2',
    question: 'What is the team size requirement for registration?',
    answer: 'Teams can consist of 1 to 5 members. Solo participation is permitted, and cross-departmental teams are encouraged.',
    category: 'Registration',
  },
  {
    id: 'faq-3',
    question: 'How do I register my team for PRAGATHI 2K26?',
    answer: 'Visit the Register page, enter your primary email address, fill in your team and institution details, provide your project title and abstract, then review and confirm your registration. The entire process is completed online through the official PRAGATHI 2K26 portal.',
    category: 'Registration',
  },
  {
    id: 'faq-4',
    question: 'What happens after I submit my registration?',
    answer: 'After successful registration, you will receive a unique Registration ID (e.g., PRAGATHI26-XXXXXX). Your project abstract will be reviewed by the evaluation committee. Shortlisted teams will be notified with stall allocation details before Expo Day.',
    category: 'Registration',
  },
  {
    id: 'faq-5',
    question: 'What facilities are provided at the stall on Expo Day?',
    answer: 'Each registered and shortlisted team receives an allocated display stall with standard power supply, poster backing board, Wi-Fi connectivity, and table display space at the SR University campus pavilion.',
    category: 'Expo Rules',
  },
  {
    id: 'faq-6',
    question: 'Will participants receive certificates?',
    answer: 'Yes. Registered participants will receive participation certificates for PRAGATHI 2K26.',
    category: 'Expo Rules',
  },
  {
    id: 'faq-7',
    question: 'Will participants receive lunch?',
    answer: 'Yes. Lunch will be provided to registered participants during PRAGATHI 2K26 on the event day.',
    category: 'Expo Rules',
  },
];
