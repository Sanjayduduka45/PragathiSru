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
    id: 'civil-engineering-smart-infrastructure',
    title: 'Civil Engineering & Smart Infrastructure',
    description: 'Smart materials, sustainable construction, transportation systems, structural health monitoring, and smart city infrastructure.',
    iconName: 'Building2',
    color: 'from-amber-600 to-orange-700',
    badgeText: 'Civil & Infra Track',
  },
  {
    id: 'electrical-engineering-energy-systems',
    title: 'Electrical Engineering & Energy Systems',
    description: 'Power systems, smart grids, renewable energy, power electronics, electric vehicles, and high-efficiency drives.',
    iconName: 'Zap',
    color: 'from-yellow-600 to-amber-700',
    badgeText: 'Electrical & Energy Track',
  },
  {
    id: 'mechanical-engineering-automation',
    title: 'Mechanical Engineering & Automation',
    description: 'Robotics, advanced manufacturing, CAD/CAM, thermal systems, automotive innovation, and industrial automation.',
    iconName: 'Cpu',
    color: 'from-slate-600 to-zinc-700',
    badgeText: 'Mechanical Track',
  },
  {
    id: 'electronics-communication-technologies',
    title: 'Electronics & Communication Technologies',
    description: 'IoT devices, embedded systems, wireless communications, VLSI design, signal processing, and sensor networks.',
    iconName: 'Zap',
    color: 'from-cyan-600 to-blue-700',
    badgeText: 'ECE & IoT Track',
  },
  {
    id: 'computer-science-artificial-intelligence',
    title: 'Computer Science & Artificial Intelligence',
    description: 'AI/ML algorithms, cloud computing, cybersecurity, data science, mobile & web architectures, and intelligent systems.',
    iconName: 'Cpu',
    color: 'from-blue-600 to-indigo-600',
    badgeText: 'CSE & AI Track',
  },
  {
    id: 'business-management-entrepreneurship',
    title: 'Business Management & Entrepreneurship',
    description: 'FinTech, business model innovations, supply chain management, marketing tech, startup models, and digital transformation.',
    iconName: 'Lightbulb',
    color: 'from-violet-600 to-purple-700',
    badgeText: 'Management & Startup Track',
  },
  {
    id: 'agriculture-agri-innovation',
    title: 'Agriculture & Agri-Innovation',
    description: 'Precision farming, smart irrigation, drone monitoring, post-harvest tech, soil analytics, and agro-biotechnology.',
    iconName: 'Leaf',
    color: 'from-emerald-600 to-teal-700',
    badgeText: 'Agri-Tech Track',
  },
  {
    id: 'healthcare-biomedical-innovations',
    title: 'Healthcare & Biomedical Innovations',
    description: 'Medical diagnostics, biomedical devices, health monitoring systems, telemedicine, assistive devices, and bioinformatics.',
    iconName: 'HeartPulse',
    color: 'from-rose-600 to-pink-700',
    badgeText: 'Healthcare & Bio Track',
  },
  {
    id: 'multidisciplinary-smart-solution',
    title: 'Multidisciplinary Innovation & Smart Solution',
    description: 'Cross-domain integrations, social impact prototypes, disability assistance, smart governance, and open innovation.',
    iconName: 'Lightbulb',
    color: 'from-blue-700 to-sky-600',
    badgeText: 'Multidisciplinary Track',
  },
  {
    id: 'school-innovation-young-innovators',
    title: 'School Innovation & Young Innovators (For 8th–12th Standard Students)',
    description: 'Creative STEM models, beginner robotics, science exhibits, sustainability ideas, and early-stage inventive prototypes.',
    iconName: 'GraduationCap',
    color: 'from-teal-600 to-cyan-700',
    badgeText: 'School Innovators Track',
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
    time: '08:30 AM – 09:00 AM',
    event: 'Registration & Reporting of Participating Teams',
    location: 'SR University Campus',
    description: '• Registration & Reporting of Participating Teams\n• Project Stall Allocation, Poster Display & Prototype Setup',
    badge: 'Registration',
  },
  {
    time: '09:00 AM – 09:40 AM',
    event: 'Chief Guest & Jury Members Reporting',
    location: 'SR University Campus',
    description: '• Chief Guest & Jury Members Reporting\n• Interaction with Hon\'ble Vice Chancellor, SR University\n• Refreshments to Chief Guest & Jury Members',
    badge: 'Dignitaries',
  },
  {
    time: '09:50 AM – 10:00 AM',
    event: 'Official Opening of PRAGATHI 2K26 - Ribbon Cutting',
    location: 'Main Expo Arena',
    description: 'Official Ribbon Cutting ceremony marking the commencement of PRAGATHI 2K26.',
    badge: 'Official Opening',
  },
  {
    time: '10:00 AM – 12:00 Noon',
    event: 'Chief Guest & Hon\'ble Vice Chancellor Visit & Interaction with Project Teams',
    location: 'Project Stalls / Expo Arena',
    description: 'Chief Guest & Hon\'ble Vice Chancellor visit project stalls and interact with student innovator teams.',
    badge: 'VIP Visit',
  },
  {
    time: '10:00 AM – 01:00 PM',
    event: 'Project Evaluation & Exhibition',
    location: 'Expo Halls & Exhibition Arena',
    description: '• Theme-wise Project Evaluation by Jury Members\n• Project Exhibition Open for Visitors, Faculty & Students\n• School Students Visit / Visitor Interaction / Photography',
    badge: 'Evaluation & Expo',
  },
  {
    time: '01:00 PM – 02:00 PM',
    event: 'Lunch Break',
    location: 'University Dining Hall',
    description: 'Lunch break for participants, jury members, guests, faculty mentors, and coordinators.',
    badge: 'Lunch Break',
  },
  {
    time: '02:00 PM – 02:40 PM',
    event: 'Project Exhibition Open',
    location: 'Expo Halls & Exhibition Arena',
    description: '• Project Exhibition Open for Visitors, Faculty & Students\n• School Students Visit / Visitor Interaction / Photography',
    badge: 'Open Exhibition',
  },
  {
    time: '02:40 PM – 03:00 PM',
    event: 'All Participants Assemble at the Valedictory Venue',
    location: 'Main Auditorium',
    description: 'All participants, team members, and attendees assemble at the main auditorium for the valedictory ceremony.',
    badge: 'Assembly',
  },
  {
    time: '03:00 PM – 04:10 PM',
    event: 'Valedictory Ceremony, Prize Distribution & Formal Closure',
    location: 'Main Auditorium',
    description: 'Valedictory Ceremony, Prize Distribution & Formal Closure of PRAGATHI 2K26.',
    badge: 'Valedictory',
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
