import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Building2 } from 'lucide-react';
import { EVENT_DETAILS } from '../../../utils/constants';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';
import { getEventSettings, updateEventSettings } from '../../../services/contentService';
import { useContent } from '../../../context/ContentContext';

interface EventFormData {
  name: string;
  fullTitle: string;
  tagline: string;
  eventDate: string;
  venue: string;
  institution: string;
  location: string;
  prizePool: string;
  contactEmail: string;
  helpline: string;
}

const INITIAL: EventFormData = {
  name: EVENT_DETAILS.name,
  fullTitle: EVENT_DETAILS.fullTitle,
  tagline: EVENT_DETAILS.tagline,
  eventDate: EVENT_DETAILS.eventDate,
  venue: EVENT_DETAILS.venue,
  institution: EVENT_DETAILS.institution,
  location: EVENT_DETAILS.location,
  prizePool: EVENT_DETAILS.prizePool,
  contactEmail: EVENT_DETAILS.contactEmail,
  helpline: EVENT_DETAILS.helpline,
};

const Field: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  readOnly?: boolean;
}> = ({ label, id, value, onChange, hint, readOnly }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5">
      {label}
    </label>
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
        readOnly
          ? 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'
          : 'border-slate-200 bg-white focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100'
      }`}
    />
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const EventDetailsAdmin: React.FC = () => {
  const [form, setForm] = useState<EventFormData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, dismissToast } = useAdminToast();
  const { refreshContent, eventSettings, contentLoading } = useContent();

  // Sync form from ContentContext when public content finishes loading.
  // This removes the duplicate getEventSettings() fetch that ContentContext already performs.
  useEffect(() => {
    if (!contentLoading) {
      setForm({
        name: eventSettings.eventName,
        fullTitle: eventSettings.fullTitle,
        tagline: eventSettings.tagline,
        eventDate: eventSettings.eventDate,
        venue: eventSettings.venue,
        institution: eventSettings.institution,
        location: eventSettings.location,
        prizePool: eventSettings.prizePool,
        contactEmail: eventSettings.contactEmail,
        helpline: eventSettings.helpline,
      });
      setLoading(false);
    }
  }, [contentLoading, eventSettings]);

  const set = (key: keyof EventFormData) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateEventSettings({
        eventName: form.name,
        fullTitle: form.fullTitle,
        tagline: form.tagline,
        eventDate: form.eventDate,
        venue: form.venue,
        institution: form.institution,
        location: form.location,
        prizePool: form.prizePool,
        contactEmail: form.contactEmail,
        helpline: form.helpline,
      });
      await refreshContent();
      addToast('success', 'Event details saved', 'Changes saved to Supabase database.');
    } catch (err: unknown) {
      console.error('Save event details error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to save changes', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    const s = await getEventSettings();
    setForm({
      name: s.eventName,
      fullTitle: s.fullTitle,
      tagline: s.tagline,
      eventDate: s.eventDate,
      venue: s.venue,
      institution: s.institution,
      location: s.location,
      prizePool: s.prizePool,
      contactEmail: s.contactEmail,
      helpline: s.helpline,
    });
    setLoading(false);
    addToast('info', 'Reset to current values', 'All fields restored to database values.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#004182]" />
            <h2 className="text-lg font-extrabold text-slate-900">Event Details</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage the core event information displayed across the public website.
          </p>
        </div>
        {!isSupabaseConfigured && (
          <span className="shrink-0 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
            DB Not Connected
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Event Name" id="ev-name" value={form.name} onChange={set('name')} readOnly />
          <Field label="Event Date" id="ev-date" value={form.eventDate} onChange={set('eventDate')} hint="Format: DD Month YYYY" />
          <Field label="Tagline" id="ev-tagline" value={form.tagline} onChange={set('tagline')} />
          <Field label="Prize Pool" id="ev-prize" value={form.prizePool} onChange={set('prizePool')} />
          <Field label="Institution" id="ev-inst" value={form.institution} onChange={set('institution')} readOnly />
          <Field label="Location" id="ev-loc" value={form.location} onChange={set('location')} />
        </div>
        <Field
          label="Full Venue Address"
          id="ev-venue"
          value={form.venue}
          onChange={set('venue')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Support Email" id="ev-email" value={form.contactEmail} onChange={set('contactEmail')} />
          <Field label="Helpline Number" id="ev-helpline" value={form.helpline} onChange={set('helpline')} />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving || loading}
            className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
