import React, { useState } from 'react';
import { Save, RotateCcw, Info } from 'lucide-react';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';

interface AboutFormData {
  title: string;
  description: string;
  vision: string;
  objectives: string;
}

const INITIAL: AboutFormData = {
  title: 'About PRAGATHI 2K26',
  description:
    'PRAGATHI 2K26 is SR University\'s flagship National Level Project Expo, designed to ignite youth innovation, foster interdisciplinary engineering solutions, and provide a stage for high-impact prototypes. Over 500 student teams from across India showcase hardware models, software applications, renewable energy solutions, and biotech inventions evaluated by senior academicians, scientists, and incubation mentors from the SRiX (SR Innovation Exchange) ecosystem.',
  vision:
    'To create a nationally recognized platform that nurtures engineering talent, fosters innovation culture, and bridges the gap between academic learning and industry-ready solutions.',
  objectives:
    '1. Provide a platform for student innovators to present working prototypes.\n2. Encourage interdisciplinary collaboration across engineering domains.\n3. Connect participants with industry mentors and incubation opportunities.\n4. Recognize outstanding innovations with merit awards and certificates.',
};

const TextArea: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}> = ({ label, id, value, onChange, rows = 4, hint }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5">
      {label}
    </label>
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y bg-white transition-colors"
    />
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const AboutAdmin: React.FC = () => {
  const [form, setForm] = useState<AboutFormData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();

  const set = (key: keyof AboutFormData) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      addToast('error', 'Validation error', 'Title and Description are required.');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    addToast(
      isSupabaseConfigured ? 'success' : 'warning',
      isSupabaseConfigured ? 'About section saved' : 'Changes not persisted',
      isSupabaseConfigured
        ? 'Changes will reflect on the public About page.'
        : 'Supabase is not connected. Changes are local only.'
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#004182]" />
            <h2 className="text-lg font-extrabold text-slate-900">About</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage the About section content displayed on the public website.
          </p>
        </div>
        {!isSupabaseConfigured && (
          <span className="shrink-0 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
            DB Not Connected
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label htmlFor="about-title" className="block text-xs font-bold text-slate-700 mb-1.5">
            Section Title
          </label>
          <input
            id="about-title"
            type="text"
            value={form.title}
            onChange={(e) => set('title')(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
          />
        </div>

        <TextArea
          label="Description"
          id="about-desc"
          value={form.description}
          onChange={set('description')}
          rows={5}
          hint="Main introductory paragraph shown on the About page."
        />

        <TextArea
          label="Vision Statement"
          id="about-vision"
          value={form.vision}
          onChange={set('vision')}
          rows={3}
        />

        <TextArea
          label="Objectives"
          id="about-obj"
          value={form.objectives}
          onChange={set('objectives')}
          rows={5}
          hint="Each objective on a new line."
        />

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
            onClick={() => { setForm(INITIAL); addToast('info', 'Reset', 'Fields restored to original values.'); }}
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
