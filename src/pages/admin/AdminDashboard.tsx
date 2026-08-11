import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  ArrowRight,
  CreditCard,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { PROJECT_CATEGORIES, FAQS } from '../../data/eventData';
import { EVENT_DETAILS } from '../../utils/constants';
import { StatCardSkeleton } from '../../components/admin/AdminSkeleton';
import { getDomainCount, getFaqCount, getEventSettings, type SiteSettings, DEFAULT_SITE_SETTINGS } from '../../services/contentService';

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
  const [domainCount, setDomainCount] = useState<number>(PROJECT_CATEGORIES.length);
  const [faqCount, setFaqCount] = useState<number>(FAQS.length);
  const [eventSettings, setEventSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const fetchStats = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setRegStats({
        total: 0,
        free: 0,
        paid: 0,
        loading: false,
        error: false,
      });
      return;
    }

    setRegStats((s) => ({ ...s, loading: true, error: false }));

    try {
      const [totalRes, freeRes, paidRes, dCount, fCount, eSettings] = await Promise.all([
        supabase.from('registrations').select('*', { count: 'exact', head: true }),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('payment_status', 'not_required'),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
        getDomainCount(),
        getFaqCount(),
        getEventSettings(),
      ]);

      if (totalRes.error || freeRes.error || paidRes.error) {
        setRegStats((s) => ({ ...s, loading: false, error: true }));
        return;
      }

      setRegStats({
        total: totalRes.count ?? 0,
        free: freeRes.count ?? 0,
        paid: paidRes.count ?? 0,
        loading: false,
        error: false,
      });
      setDomainCount(dCount);
      setFaqCount(fCount);
      setEventSettings(eSettings);
    } catch (err) {
      console.error('Failed to fetch admin dashboard stats:', err);
      setRegStats((s) => ({ ...s, loading: false, error: true }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, isSupabaseReady]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Welcome Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h2>
        <p className="text-sm text-slate-500">
          {eventSettings.eventName} Management Dashboard — {eventSettings.eventDate}
        </p>
      </div>

      {/* Stat Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Registration Overview
          </h3>
          {regStats.error && (
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>

        {regStats.error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">Unable to load dashboard data.</span>
            </div>
            <button
              type="button"
              onClick={fetchStats}
              className="bg-white hover:bg-slate-100 text-rose-800 border border-rose-300 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {regStats.loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="Total Registrations"
                  value={regStats.total}
                  icon={<FileText className="w-4.5 h-4.5 text-[#004182]" />}
                  color="bg-blue-50"
                  linkTo="/admin/registrations"
                />
                <StatCard
                  label="Free Registrations"
                  value={regStats.free}
                  icon={<CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />}
                  color="bg-emerald-50"
                  linkTo="/admin/registrations"
                />
                <StatCard
                  label="Paid Registrations"
                  value={regStats.paid}
                  icon={<CreditCard className="w-4.5 h-4.5 text-amber-600" />}
                  color="bg-amber-50"
                  linkTo="/admin/registrations"
                />
              </>
            )}
            <StatCard
              label="Project Domains"
              value={domainCount}
              icon={<Layers className="w-4.5 h-4.5 text-indigo-600" />}
              color="bg-indigo-50"
              linkTo="/admin/content/domains"
            />
            <StatCard
              label="Active FAQs"
              value={faqCount}
              icon={<HelpCircle className="w-4.5 h-4.5 text-violet-600" />}
              color="bg-violet-50"
              linkTo="/admin/content/faqs"
            />
          </div>
        )}
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
            label="Testimonials"
            path="/admin/content/testimonials"
            description="Event memories & showcase"
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
              { label: 'Event Name', value: eventSettings.eventName },
              { label: 'Date', value: eventSettings.eventDate },
              { label: 'Prize Pool', value: eventSettings.prizePool },
              { label: 'Institution', value: eventSettings.institution },
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
