import React from 'react';
import {
  Building2,
  Zap,
  Cog,
  Radio,
  Cpu,
  TrendingUp,
  Leaf,
  HeartPulse,
  Network,
  Lightbulb,
  Layers,
} from 'lucide-react';

export interface DomainTheme {
  primaryColor: string;
  cardBg: string;
  borderColor: string;
  hoverBorder: string;
  iconBg: string;
  iconColor: string;
  iconHoverBg: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  accentGlow: string;
  accentBar: string;
  icon: React.ReactNode;
  illustration: React.ReactNode;
}

export const DOMAIN_THEMES: Record<string, DomainTheme> = {
  // 1. Civil Engineering & Smart Infrastructure (Blue)
  'civil-engineering-smart-infrastructure': {
    primaryColor: '#1d4ed8',
    cardBg: 'bg-gradient-to-br from-blue-50/90 via-white to-sky-50/50',
    borderColor: 'border-blue-200/80',
    hoverBorder: 'hover:border-blue-400 hover:shadow-blue-500/15',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    iconHoverBg: 'group-hover:bg-blue-600 group-hover:text-white',
    badgeBg: 'bg-blue-50/90',
    badgeColor: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentGlow: 'bg-blue-300/40',
    accentBar: 'bg-blue-600',
    icon: <Building2 className="w-6 h-6 text-blue-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-blue-600/30"
        aria-hidden="true"
      >
        {/* Blueprint Grid Lines */}
        <line x1="10" y1="130" x2="150" y2="130" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="90" x2="150" y2="90" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="10" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        {/* Bridge / Skyscraper Architecture */}
        <path
          d="M20 130V65L50 40L80 65V130M80 130V30L110 15L140 30V130"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Suspension Cables */}
        <path d="M20 65C45 90 75 90 80 65" stroke="currentColor" strokeWidth="1.5" />
        <path d="M80 30C105 65 135 65 140 30" stroke="currentColor" strokeWidth="1.5" />
        {/* Structural Windows */}
        <rect x="90" y="45" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="105" y="45" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="90" y="70" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="105" y="70" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="30" y="75" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },

  // 2. Electrical Engineering & Energy Systems (Green)
  'electrical-engineering-energy-systems': {
    primaryColor: '#059669',
    cardBg: 'bg-gradient-to-br from-emerald-50/90 via-white to-green-50/50',
    borderColor: 'border-emerald-200/80',
    hoverBorder: 'hover:border-emerald-400 hover:shadow-emerald-500/15',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    iconHoverBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    badgeBg: 'bg-emerald-50/90',
    badgeColor: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    accentGlow: 'bg-emerald-300/40',
    accentBar: 'bg-emerald-600',
    icon: <Zap className="w-6 h-6 text-emerald-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-emerald-600/30"
        aria-hidden="true"
      >
        {/* Wind Turbine Mast & Blades */}
        <line x1="50" y1="130" x2="50" y2="45" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="50" cy="45" r="4" fill="currentColor" />
        <path d="M50 45L30 15M50 45L75 30M50 45L45 75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Solar Panel Grid */}
        <polygon points="80,125 145,125 135,80 90,80" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="112" y1="80" x2="112" y2="125" stroke="currentColor" strokeWidth="1.5" />
        <line x1="86" y1="102" x2="139" y2="102" stroke="currentColor" strokeWidth="1.5" />
        {/* Energy Pulse Wave */}
        <path
          d="M10 100Q25 80 40 100T70 100T100 100T130 100T155 100"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        {/* Sun / Energy Arc */}
        <circle cx="125" cy="35" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M125 10V18M125 52V60M100 35H108M142 35H150" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },

  // 3. Mechanical Engineering & Automation (Orange)
  'mechanical-engineering-automation': {
    primaryColor: '#ea580c',
    cardBg: 'bg-gradient-to-br from-orange-50/90 via-white to-amber-50/50',
    borderColor: 'border-orange-200/80',
    hoverBorder: 'hover:border-orange-400 hover:shadow-orange-500/15',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700',
    iconHoverBg: 'group-hover:bg-orange-600 group-hover:text-white',
    badgeBg: 'bg-orange-50/90',
    badgeColor: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    accentGlow: 'bg-orange-300/40',
    accentBar: 'bg-orange-600',
    icon: <Cog className="w-6 h-6 text-orange-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-orange-600/30"
        aria-hidden="true"
      >
        {/* Large Main Gear */}
        <g transform="translate(100, 60)">
          <circle cx="0" cy="0" r="28" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="0" cy="0" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M-4 -34H4V-26H-4ZM-4 26H4V34H-4ZM-34 -4V4H-26V-4ZM26 -4V4H34V-4ZM-22 -22L-16 -16L-10 -22L-16 -28ZM16 16L22 22L28 16L22 10ZM-22 22L-16 16L-22 10L-28 16ZM22 -22L16 -16L22 -10L28 -16Z"
            fill="currentColor"
          />
        </g>
        {/* Interlocking Small Gear */}
        <g transform="translate(48, 100)">
          <circle cx="0" cy="0" r="18" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <circle cx="0" cy="0" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M-3 -22H3V-16H-3ZM-3 16H3V22H-3ZM-22 -3V3H-16V-3ZM16 -3V3H22V-3Z" fill="currentColor" />
        </g>
        {/* Robotic Arm Linkage */}
        <path d="M20 40L45 25L65 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="20" cy="40" r="4" fill="currentColor" />
        <circle cx="45" cy="25" r="4" fill="currentColor" />
        <circle cx="65" cy="50" r="3" fill="currentColor" />
      </svg>
    ),
  },

  // 4. Electronics & Communication Technologies (Purple)
  'electronics-communication-technologies': {
    primaryColor: '#9333ea',
    cardBg: 'bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/50',
    borderColor: 'border-purple-200/80',
    hoverBorder: 'hover:border-purple-400 hover:shadow-purple-500/15',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
    iconHoverBg: 'group-hover:bg-purple-600 group-hover:text-white',
    badgeBg: 'bg-purple-50/90',
    badgeColor: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    accentGlow: 'bg-purple-300/40',
    accentBar: 'bg-purple-600',
    icon: <Radio className="w-6 h-6 text-purple-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-purple-600/30"
        aria-hidden="true"
      >
        {/* Antenna Tower */}
        <path d="M80 130L95 40L110 130M85 70H105M88 100H102M95 40V25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="95" cy="22" r="3.5" fill="currentColor" />
        {/* Radio Wave Broadcast Arcs */}
        <path d="M78 15C65 20 65 30 78 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M68 5C50 15 50 40 68 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M112 15C125 20 125 30 112 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M122 5C140 15 140 40 122 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* PCB Circuit Traces */}
        <path d="M15 120H45L60 95H75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="15" cy="120" r="3" fill="currentColor" />
        <circle cx="75" cy="95" r="3" fill="currentColor" />
        <path d="M25 80H45L55 65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="25" cy="80" r="2.5" fill="currentColor" />
      </svg>
    ),
  },

  // 5. Computer Science & Artificial Intelligence (Electric Blue)
  'computer-science-artificial-intelligence': {
    primaryColor: '#0284c7',
    cardBg: 'bg-gradient-to-br from-sky-50/90 via-white to-blue-50/50',
    borderColor: 'border-sky-200/80',
    hoverBorder: 'hover:border-sky-400 hover:shadow-sky-500/15',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-700',
    iconHoverBg: 'group-hover:bg-sky-600 group-hover:text-white',
    badgeBg: 'bg-sky-50/90',
    badgeColor: 'text-sky-800',
    badgeBorder: 'border-sky-200',
    accentGlow: 'bg-sky-300/40',
    accentBar: 'bg-sky-600',
    icon: <Cpu className="w-6 h-6 text-sky-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-sky-600/30"
        aria-hidden="true"
      >
        {/* Central Neural Processor / AI Chip */}
        <rect x="85" y="45" width="48" height="48" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="97" y="57" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="109" cy="69" r="4" fill="currentColor" />
        {/* Chip Pins */}
        <line x1="95" y1="35" x2="95" y2="45" stroke="currentColor" strokeWidth="2" />
        <line x1="109" y1="35" x2="109" y2="45" stroke="currentColor" strokeWidth="2" />
        <line x1="123" y1="35" x2="123" y2="45" stroke="currentColor" strokeWidth="2" />
        <line x1="95" y1="93" x2="95" y2="103" stroke="currentColor" strokeWidth="2" />
        <line x1="109" y1="93" x2="109" y2="103" stroke="currentColor" strokeWidth="2" />
        <line x1="123" y1="93" x2="123" y2="103" stroke="currentColor" strokeWidth="2" />
        <line x1="75" y1="57" x2="85" y2="57" stroke="currentColor" strokeWidth="2" />
        <line x1="75" y1="69" x2="85" y2="69" stroke="currentColor" strokeWidth="2" />
        <line x1="75" y1="81" x2="85" y2="81" stroke="currentColor" strokeWidth="2" />
        {/* Neural Network Nodes & Synapses */}
        <circle cx="35" cy="40" r="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="30" cy="80" r="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="45" cy="115" r="5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="39" y1="43" x2="75" y2="57" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
        <line x1="35" y1="80" x2="75" y2="69" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
        <line x1="49" y1="112" x2="75" y2="81" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
        <line x1="33" y1="45" x2="31" y2="75" stroke="currentColor" strokeWidth="1" />
        <line x1="32" y1="85" x2="43" y2="111" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },

  // 6. Business Management & Entrepreneurship (Pink / Magenta)
  'business-management-entrepreneurship': {
    primaryColor: '#db2777',
    cardBg: 'bg-gradient-to-br from-pink-50/90 via-white to-rose-50/50',
    borderColor: 'border-pink-200/80',
    hoverBorder: 'hover:border-pink-400 hover:shadow-pink-500/15',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-700',
    iconHoverBg: 'group-hover:bg-pink-600 group-hover:text-white',
    badgeBg: 'bg-pink-50/90',
    badgeColor: 'text-pink-800',
    badgeBorder: 'border-pink-200',
    accentGlow: 'bg-pink-300/40',
    accentBar: 'bg-pink-600',
    icon: <TrendingUp className="w-6 h-6 text-pink-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-pink-600/30"
        aria-hidden="true"
      >
        {/* Growth Bar Chart */}
        <rect x="35" y="90" width="16" height="35" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="62" y="70" width="16" height="55" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="89" y="48" width="16" height="77" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="116" y="25" width="16" height="100" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        {/* Base Axis */}
        <line x1="20" y1="125" x2="145" y2="125" stroke="currentColor" strokeWidth="2" />
        {/* Upward Trajectory Arrow */}
        <path
          d="M25 105L55 82L85 60L125 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M110 18H125V33" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Analytics Nodes */}
        <circle cx="55" cy="82" r="3.5" fill="currentColor" />
        <circle cx="85" cy="60" r="3.5" fill="currentColor" />
        <circle cx="125" cy="18" r="4" fill="currentColor" />
      </svg>
    ),
  },

  // 7. Agriculture & Agri-Innovation (Green)
  'agriculture-agri-innovation': {
    primaryColor: '#15803d',
    cardBg: 'bg-gradient-to-br from-lime-50/80 via-white to-emerald-50/50',
    borderColor: 'border-lime-200/80',
    hoverBorder: 'hover:border-emerald-400 hover:shadow-emerald-500/15',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    iconHoverBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    badgeBg: 'bg-emerald-50/90',
    badgeColor: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    accentGlow: 'bg-emerald-300/40',
    accentBar: 'bg-emerald-600',
    icon: <Leaf className="w-6 h-6 text-emerald-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-emerald-600/30"
        aria-hidden="true"
      >
        {/* Sprout & Leaves */}
        <path
          d="M95 125C95 90 95 65 110 40C90 45 75 60 75 80C75 100 85 115 95 125Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M95 85C115 75 130 55 135 30C110 32 98 48 95 65"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line x1="95" y1="125" x2="95" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Farmland Furrow Curves */}
        <path d="M15 125C35 110 65 110 85 125" stroke="currentColor" strokeWidth="1.8" />
        <path d="M25 105C45 92 68 95 82 105" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <path d="M35 88C52 78 68 80 80 88" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
        {/* Smart Drone in Sky */}
        <circle cx="45" cy="35" r="4" fill="currentColor" />
        <line x1="35" y1="35" x2="55" y2="35" stroke="currentColor" strokeWidth="1.5" />
        <line x1="45" y1="25" x2="45" y2="45" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="35" cy="35" r="3" stroke="currentColor" strokeWidth="1" />
        <circle cx="55" cy="35" r="3" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },

  // 8. Healthcare & Biomedical Innovations (Cyan / Medical Blue)
  'healthcare-biomedical-innovations': {
    primaryColor: '#0891b2',
    cardBg: 'bg-gradient-to-br from-cyan-50/90 via-white to-teal-50/50',
    borderColor: 'border-cyan-200/80',
    hoverBorder: 'hover:border-cyan-400 hover:shadow-cyan-500/15',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-700',
    iconHoverBg: 'group-hover:bg-cyan-600 group-hover:text-white',
    badgeBg: 'bg-cyan-50/90',
    badgeColor: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    accentGlow: 'bg-cyan-300/40',
    accentBar: 'bg-cyan-600',
    icon: <HeartPulse className="w-6 h-6 text-cyan-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-cyan-600/30"
        aria-hidden="true"
      >
        {/* ECG Heartbeat Wave */}
        <path
          d="M10 85H40L50 60L60 110L75 45L85 95L95 80L105 85H150"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Medical Cross */}
        <g transform="translate(110, 40)">
          <rect x="-12" y="-4" width="24" height="8" rx="2" fill="currentColor" />
          <rect x="-4" y="-12" width="8" height="24" rx="2" fill="currentColor" />
          <circle cx="0" cy="0" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        </g>
        {/* DNA Helix Strands */}
        <path d="M25 25C40 35 40 50 25 60C10 70 10 85 25 95" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M45 25C30 35 30 50 45 60C60 70 60 85 45 95" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
    ),
  },

  // 9. Multidisciplinary Innovation & Smart Solutions (Violet / Indigo)
  'multidisciplinary-smart-solution': {
    primaryColor: '#7c3aed',
    cardBg: 'bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/50',
    borderColor: 'border-violet-200/80',
    hoverBorder: 'hover:border-violet-400 hover:shadow-violet-500/15',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
    iconHoverBg: 'group-hover:bg-violet-600 group-hover:text-white',
    badgeBg: 'bg-violet-50/90',
    badgeColor: 'text-violet-800',
    badgeBorder: 'border-violet-200',
    accentGlow: 'bg-violet-300/40',
    accentBar: 'bg-violet-600',
    icon: <Network className="w-6 h-6 text-violet-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-violet-600/30"
        aria-hidden="true"
      >
        {/* Central Core & Orbital Hub */}
        <circle cx="105" cy="70" r="14" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="105" cy="70" r="5" fill="currentColor" />
        {/* Outer Interconnected Nodes */}
        <circle cx="50" cy="40" r="7" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="45" cy="100" r="7" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="135" cy="30" r="6" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="140" cy="115" r="6" stroke="currentColor" strokeWidth="1.8" />
        {/* Constellation Connector Lines */}
        <line x1="57" y1="42" x2="92" y2="64" stroke="currentColor" strokeWidth="1.8" />
        <line x1="52" y1="98" x2="93" y2="76" stroke="currentColor" strokeWidth="1.8" />
        <line x1="130" y1="35" x2="114" y2="58" stroke="currentColor" strokeWidth="1.8" />
        <line x1="135" y1="110" x2="115" y2="82" stroke="currentColor" strokeWidth="1.8" />
        <line x1="50" y1="47" x2="45" y2="93" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1="135" y1="36" x2="140" y2="109" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
      </svg>
    ),
  },

  // 10. School Innovation & Young Innovators (Amber / Gold)
  'school-innovation-young-innovators': {
    primaryColor: '#d97706',
    cardBg: 'bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/50',
    borderColor: 'border-amber-200/80',
    hoverBorder: 'hover:border-amber-400 hover:shadow-amber-500/15',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    iconHoverBg: 'group-hover:bg-amber-500 group-hover:text-white',
    badgeBg: 'bg-amber-50/90',
    badgeColor: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentGlow: 'bg-amber-300/40',
    accentBar: 'bg-amber-600',
    icon: <Lightbulb className="w-6 h-6 text-amber-700" />,
    illustration: (
      <svg
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-amber-600/30"
        aria-hidden="true"
      >
        {/* Giant Lightbulb */}
        <g transform="translate(100, 65)">
          <path
            d="M0 -35C-18 -35 -30 -22 -30 -5C-30 8 -20 18 -15 28H15C20 18 30 8 30 -5C30 -22 18 -35 0 -35Z"
            stroke="currentColor"
            strokeWidth="2.2"
            fill="none"
          />
          {/* Filament */}
          <path d="M-8 8L-5 -12L5 -12L8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {/* Bulb Base */}
          <path d="M-12 28H12M-10 33H10M-6 38H6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          {/* Radiating Spark Rays */}
          <line x1="0" y1="-42" x2="0" y2="-50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="-28" y1="-30" x2="-35" y2="-37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="-30" x2="35" y2="-37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="-38" y1="-5" x2="-46" y2="-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="38" y1="-5" x2="46" y2="-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Creativity Sparkle Stars */}
        <path d="M40 30L43 38L51 41L43 44L40 52L37 44L29 41L37 38Z" fill="currentColor" />
        <path d="M55 85L57 91L63 93L57 95L55 101L53 95L47 93L53 91Z" fill="currentColor" />
      </svg>
    ),
  },
};

// Fallback theme
export const DEFAULT_DOMAIN_THEME: DomainTheme = DOMAIN_THEMES['civil-engineering-smart-infrastructure'];

/**
 * Robust helper function that matches any ID or Title to its exact domain theme.
 */
export function getDomainTheme(id?: string, title?: string): DomainTheme {
  const normId = (id || '').toLowerCase().trim();
  const normTitle = (title || '').toLowerCase().trim();

  // 1. Direct ID match
  if (DOMAIN_THEMES[normId]) {
    return DOMAIN_THEMES[normId];
  }

  // 2. Keyword matching across title or id
  const combined = `${normId} ${normTitle}`;

  if (combined.includes('civil') || combined.includes('infrastructure') || combined.includes('smart city')) {
    return DOMAIN_THEMES['civil-engineering-smart-infrastructure'];
  }
  if (combined.includes('electrical') || combined.includes('energy') || combined.includes('power') || combined.includes('renewable') || combined.includes('green energy') || combined.includes('sustainability')) {
    return DOMAIN_THEMES['electrical-engineering-energy-systems'];
  }
  if (combined.includes('mechanical') || combined.includes('automation') || combined.includes('robotics') || combined.includes('cad')) {
    return DOMAIN_THEMES['mechanical-engineering-automation'];
  }
  if (combined.includes('electronics') || combined.includes('communication') || combined.includes('embedded') || combined.includes('iot') || combined.includes('vlsi') || combined.includes('hardware')) {
    return DOMAIN_THEMES['electronics-communication-technologies'];
  }
  if (combined.includes('computer') || combined.includes('artificial') || combined.includes('ai') || combined.includes('software') || combined.includes('data science') || combined.includes('cloud')) {
    return DOMAIN_THEMES['computer-science-artificial-intelligence'];
  }
  if (combined.includes('business') || combined.includes('management') || combined.includes('entrepreneurship') || combined.includes('startup') || combined.includes('fintech')) {
    return DOMAIN_THEMES['business-management-entrepreneurship'];
  }
  if (combined.includes('agri') || combined.includes('agriculture') || combined.includes('farming') || combined.includes('soil')) {
    return DOMAIN_THEMES['agriculture-agri-innovation'];
  }
  if (combined.includes('health') || combined.includes('biomedical') || combined.includes('medtech') || combined.includes('biotech') || combined.includes('medical')) {
    return DOMAIN_THEMES['healthcare-biomedical-innovations'];
  }
  if (combined.includes('multidisciplinary') || combined.includes('multi') || combined.includes('smart solution') || combined.includes('open innovation')) {
    return DOMAIN_THEMES['multidisciplinary-smart-solution'];
  }
  if (combined.includes('school') || combined.includes('young') || combined.includes('8th') || combined.includes('stem')) {
    return DOMAIN_THEMES['school-innovation-young-innovators'];
  }

  return DEFAULT_DOMAIN_THEME;
}
