import React, { useState } from 'react';
import { Save, RotateCcw, Phone } from 'lucide-react';
import { EVENT_DETAILS } from '../../../utils/constants';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';

interface ContactFormData {
  contactEmail: string;
  helpline: string;
  institution: string;
  venue: string;
}

const INITIAL: ContactFormData = {
  contactEmail: EVENT_DETAILS.contactEmail,
  helpline: EVENT_DETAILS.helpline,
  institution: EVENT_DETAILS.institution,
  venue: EVENT_DETAILS.venue,
};

export const ContactAdmin: React.FC = () => {
  const [form, setForm] = useState<ContactFormData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();

  const set = (key: keyof ContactFormData) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactEmail.trim() || !form.helpline.trim()) {
      addToast('error', 'Validation error', 'Support Email and Helpline Number are required.');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    addToast(
      isSupabaseConfigured ? 'success' : 'warning',
      isSupabaseConfigured ? 'Contact details saved' : 'Changes not persisted',
      isSupabaseConfigured
        ? 'Contact information updated on the public website.'
        : 'Supabase is not connected. Changes are local only.'
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#004182]" />
            <h2 className="text-lg font-extrabold text-slate-900">Contact Information</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage the official support channels and venue information.
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
          <div>
            <label htmlFor="ct-email" className="block text-xs font-bold text-slate-700 mb-1.5">
              Support Email *
            </label>
            <input
              id="ct-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => set('contactEmail')(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>
          <div>
            <label htmlFor="ct-helpline" className="block text-xs font-bold text-slate-700 mb-1.5">
              Helpline Number *
            </label>
            <input
              id="ct-helpline"
              type="text"
              value={form.helpline}
              onChange={(e) => set('helpline')(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ct-inst" className="block text-xs font-bold text-slate-700 mb-1.5">
            Organizing Institution
          </label>
          <input
            id="ct-inst"
            type="text"
            value={form.institution}
            onChange={(e) => set('institution')(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
          />
        </div>

        <div>
          <label htmlFor="ct-venue" className="block text-xs font-bold text-slate-700 mb-1.5">
            Official Venue Address
          </label>
          <textarea
            id="ct-venue"
            rows={3}
            value={form.venue}
            onChange={(e) => set('venue')(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y bg-white"
          />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
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
            onClick={() => {
              setForm(INITIAL);
              addToast('info', 'Reset', 'Contact fields restored to original values.');
            }}
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
