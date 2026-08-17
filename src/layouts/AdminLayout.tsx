import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  HelpCircle,
  Users,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  Info,
  Layers,
  Clock,
  BookOpen,
  Phone,
  Star,
  GraduationCap,
  MessageSquare,
  FileImage,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

interface NavGroup {
  label: string;
  items: NavLinkItem[];
}

interface NavLinkItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const NAV_STRUCTURE: Array<NavLinkItem | { group: string; items: NavLinkItem[] }> = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    group: 'Content',
    items: [
      { label: 'Event Details', path: '/admin/content/event-details', icon: <Building2 className="w-4 h-4" /> },
      { label: 'About', path: '/admin/content/about', icon: <Info className="w-4 h-4" /> },
      { label: 'Domains', path: '/admin/content/domains', icon: <Layers className="w-4 h-4" /> },
      { label: 'Schedule', path: '/admin/content/schedule', icon: <Clock className="w-4 h-4" /> },
      { label: 'Rules & Guidelines', path: '/admin/content/rules', icon: <BookOpen className="w-4 h-4" /> },
      { label: 'Testimonials / Showcase', path: '/admin/content/testimonials', icon: <MessageSquare className="w-4 h-4" /> },
      { label: 'FAQs', path: '/admin/content/faqs', icon: <HelpCircle className="w-4 h-4" /> },
      { label: 'Sponsors', path: '/admin/content/sponsors', icon: <Star className="w-4 h-4" /> },
      { label: 'Contact', path: '/admin/content/contact', icon: <Phone className="w-4 h-4" /> },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Registrations', path: '/admin/registrations', icon: <FileText className="w-4 h-4" />, comingSoon: true },
      { label: 'Participants', path: '/admin/participants', icon: <Users className="w-4 h-4" />, comingSoon: true },
      { label: 'Judges', path: '/admin/judges', icon: <GraduationCap className="w-4 h-4" />, comingSoon: true },
      { label: 'Results', path: '/admin/results', icon: <Trophy className="w-4 h-4" />, comingSoon: true },
    ],
  },
];

const sruLogo = '/B4240911-4EF0-4DE3-8093-B50A0D0EA744_4_5005_c.jpeg';

interface SidebarContentProps {
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onClose }) => {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [contentExpanded, setContentExpanded] = useState(
    location.pathname.startsWith('/admin/content')
  );
  const [opsExpanded, setOpsExpanded] = useState(
    location.pathname.startsWith('/admin/registrations') ||
    location.pathname.startsWith('/admin/posters') ||
    location.pathname.startsWith('/admin/participants') ||
    location.pathname.startsWith('/admin/judges') ||
    location.pathname.startsWith('/admin/results')
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
    onClose?.();
  };

  const linkBase =
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150';
  const linkActive = 'bg-[#004182] text-white shadow-sm';
  const linkInactive = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  const linkDisabled = 'text-slate-400 cursor-default';

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex items-center justify-center shrink-0">
            <img
              src={sruLogo}
              alt="SR University Logo"
              className="h-8 w-auto max-w-[36px] object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[#004182] uppercase tracking-tight leading-none truncate">
              PRAGATHI 2K26
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Admin Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {/* Dashboard */}
        <NavLink
          to="/admin"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkInactive}`
          }
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Dashboard
        </NavLink>

        {/* Content Group */}
        <div className="pt-3 pb-1">
          <button
            type="button"
            onClick={() => setContentExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span>Content</span>
            {contentExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          {contentExpanded && (
            <div className="space-y-0.5 mt-1">
              {[
                { label: 'Event Details', path: '/admin/content/event-details', icon: <Building2 className="w-4 h-4" /> },
                { label: 'About', path: '/admin/content/about', icon: <Info className="w-4 h-4" /> },
                { label: 'Domains', path: '/admin/content/domains', icon: <Layers className="w-4 h-4" /> },
                { label: 'Schedule', path: '/admin/content/schedule', icon: <Clock className="w-4 h-4" /> },
                { label: 'Rules & Guidelines', path: '/admin/content/rules', icon: <BookOpen className="w-4 h-4" /> },
                { label: 'FAQs', path: '/admin/content/faqs', icon: <HelpCircle className="w-4 h-4" /> },
                { label: 'Testimonials', path: '/admin/content/testimonials', icon: <MessageSquare className="w-4 h-4" /> },
                { label: 'Sponsors', path: '/admin/content/sponsors', icon: <Star className="w-4 h-4" /> },
                { label: 'Contact', path: '/admin/content/contact', icon: <Phone className="w-4 h-4" /> },
              ].map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${linkBase} pl-4 ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Operations Group */}
        <div className="pt-1 pb-1">
          <button
            type="button"
            onClick={() => setOpsExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span>Operations</span>
            {opsExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          {opsExpanded && (
            <div className="space-y-0.5 mt-1">
              <NavLink
                to="/admin/registrations"
                onClick={onClose}
                className={({ isActive }) =>
                  `${linkBase} pl-4 ${isActive ? linkActive : linkInactive}`
                }
              >
                <FileText className="w-4 h-4 shrink-0" />
                Registrations
              </NavLink>
              <NavLink
                to="/admin/posters"
                onClick={onClose}
                className={({ isActive }) =>
                  `${linkBase} pl-4 ${isActive ? linkActive : linkInactive}`
                }
              >
                <FileImage className="w-4 h-4 shrink-0" />
                Project Posters
              </NavLink>
              <NavLink
                to="/admin/judges"
                onClick={onClose}
                className={({ isActive }) =>
                  `${linkBase} pl-4 ${isActive ? linkActive : linkInactive}`
                }
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                Judges
              </NavLink>
              <NavLink
                to="/admin/results"
                onClick={onClose}
                className={({ isActive }) =>
                  `${linkBase} pl-4 ${isActive ? linkActive : linkInactive}`
                }
              >
                <Trophy className="w-4 h-4 shrink-0" />
                Results
              </NavLink>
              <div
                className={`${linkBase} pl-4 ${linkDisabled} group`}
              >
                <Users className="w-4 h-4 shrink-0" />
                Participants
                <span className="ml-auto text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="pt-1">
          <div className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
            System
          </div>
          <NavLink
            to="/admin/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </NavLink>
        </div>
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        {user && (
          <div className="px-3 py-2 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Logged in as</p>
            <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{user.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Derive current page title from path
  const getPageTitle = () => {
    const seg = location.pathname.split('/').filter(Boolean);
    if (seg.length === 1) return 'Dashboard';
    const last = seg[seg.length - 1];
    const titles: Record<string, string> = {
      'event-details': 'Event Details',
      about: 'About',
      domains: 'Domains',
      schedule: 'Schedule',
      rules: 'Rules & Guidelines',
      faqs: 'FAQs',
      testimonials: 'Testimonials',
      sponsors: 'Sponsors',
      contact: 'Contact',
      registrations: 'Registrations',
      posters: 'Project Posters',
      participants: 'Participants',
      judges: 'Judges',
      results: 'Results',
      settings: 'Settings',
    };
    return titles[last] ?? 'Admin';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-white border-r border-slate-200 z-50">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-60 xl:ml-64 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-slate-800 truncate">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-[#004182] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              PRAGATHI 2K26 Admin
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
