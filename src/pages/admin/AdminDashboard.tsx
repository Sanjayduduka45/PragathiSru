import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { PROJECT_CATEGORIES, FAQS } from '../../data/eventData';
import { EVENT_DETAILS } from '../../utils/constants';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  linkTo?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, linkTo }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {linkTo && (
        <Link to={linkTo} className="text-[#004182] hover:text-blue-800 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

const QuickLink: React.FC<{ label: string; path: string; description: string }> = ({
  label,
  path,
  description,
}) => (
  <Link
    to={path}
    className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all group"
  >
    <ArrowRight className="w-4 h-4 text-[#004182] mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    <div>
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
  </Link>
);

export const AdminDashboard: React.FC = () => {
  const { user, isSupabaseReady } = useAdminAuth();
  const [regStats, setRegStats] = useState({
    total: 0,
    free: 0,
    paid: 0,
    loading: true,
    error: false,
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setRegStats((s) => ({ ...s, loading: false }));
      return;
    }
    const fetch = async () => {
      try {
        const { count: total } = await supabase!
          .from('registrations')
          .select('*', { count: 'exact', head: true });

        const { count: free } = await supabase!
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'not_required');

        const { count: paid } = await supabase!
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'paid');

        setRegStats({
          total: total ?? 0,
          free: free ?? 0,
          paid: paid ?? 0,
          loading: false,
          error: false,
        });
      } catch {
        setRegStats((s) => ({ ...s, loading: false, error: true }));
      }
    };
    fetch();
  }, [isSupabaseReady]);

  const regValue = regStats.loading
    ? '…'
    : !isSupabaseConfigured
    ? 0
    : regStats.error
    ? 0
    : regStats.total;

  const freeValue = regStats.loading
    ? '…'
    : !isSupabaseConfigured
    ? 0
    : regStats.error
    ? 0
    : regStats.free;

  const paidValue = regStats.loading
    ? '…'
    : !isSupabaseConfigured
    ? 0
    : regStats.error
    ? 0
    : regStats.paid;

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Welcome Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h2>
        <p className="text-sm text-slate-500">
          PRAGATHI 2K26 Management Dashboard — {EVENT_DETAILS.eventDate}
        </p>
      </div>

      {/* Stat Cards */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">
          Registration Overview
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Registrations"
            value={regValue}
            icon={<FileText className="w-4.5 h-4.5 text-[#004182]" />}
            color="bg-blue-50"
            linkTo="/admin/registrations"
          />
          <StatCard
            label="Free Registrations"
            value={freeValue}
            icon={<CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />}
            color="bg-emerald-50"
            linkTo="/admin/registrations"
          />
          <StatCard
            label="Paid Registrations"
            value={paidValue}
            icon={<CreditCard className="w-4.5 h-4.5 text-amber-600" />}
            color="bg-amber-50"
            linkTo="/admin/registrations"
          />
          <StatCard
            label="Project Domains"
            value={PROJECT_CATEGORIES.length}
            icon={<Layers className="w-4.5 h-4.5 text-indigo-600" />}
            color="bg-indigo-50"
            linkTo="/admin/content/domains"
          />
          <StatCard
            label="Active FAQs"
            value={FAQS.length}
            icon={<HelpCircle className="w-4.5 h-4.5 text-violet-600" />}
            color="bg-violet-50"
            linkTo="/admin/content/faqs"
          />
        </div>
      </div>

      {/* Content Quick Links */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">
          Content Management
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickLink
            label="Event Details"
            path="/admin/content/event-details"
            description="Name, date, venue, prize pool"
          />
          <QuickLink
            label="About"
            path="/admin/content/about"
            description="Description, vision, objectives"
          />
          <QuickLink
            label="Domains"
            path="/admin/content/domains"
            description="Manage project categories"
          />
          <QuickLink
            label="Schedule"
            path="/admin/content/schedule"
            description="Expo day timeline"
          />
          <QuickLink
            label="Rules & Guidelines"
            path="/admin/content/rules"
            description="Participation handbook"
          />
          <QuickLink
            label="FAQs"
            path="/admin/content/faqs"
            description="Frequently asked questions"
          />
          <QuickLink
            label="Sponsors"
            path="/admin/content/sponsors"
            description="Partners & sponsors"
          />
          <QuickLink
            label="Contact"
            path="/admin/content/contact"
            description="Support email & helpline"
          />
        </div>
      </div>

      {/* Event Info Summary */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">
          Event Summary
        </h3>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {[
              { label: 'Event Name', value: EVENT_DETAILS.name },
              { label: 'Date', value: EVENT_DETAILS.eventDate },
              { label: 'Prize Pool', value: EVENT_DETAILS.prizePool },
              { label: 'Institution', value: EVENT_DETAILS.institution },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  {item.label}
                </p>
                <p className="text-slate-900 font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
