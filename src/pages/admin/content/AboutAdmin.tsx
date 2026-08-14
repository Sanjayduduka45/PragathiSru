import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Info, Undo2 } from 'lucide-react';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';
import { getAboutContent, updateAboutContent, resetAboutContent, DEFAULT_ABOUT } from '../../../services/contentService';
import { useContent } from '../../../context/ContentContext';

interface AboutFormData {
  title: string;
  description: string;
  vision: string;
  objectives: string;
}

const INITIAL: AboutFormData = {
  title: DEFAULT_ABOUT.title,
  description: DEFAULT_ABOUT.description,
  vision: DEFAULT_ABOUT.vision,
  objectives: DEFAULT_ABOUT.objectives,
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
  const [resetting, setResetting] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();
  const { refreshContent } = useContent();

  useEffect(() => {
    getAboutContent()
      .then((a) => {
        setForm({
          title: a.title,
          description: a.description,
          vision: a.vision,
          objectives: a.objectives,
        });
      })
      .catch((err) => console.error('Failed to load about content:', err));
  }, []);

  const set = (key: keyof AboutFormData) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      addToast('error', 'Validation error', 'Title and Description are required.');
      return;
    }
    setSaving(true);
    try {
      await updateAboutContent(form);
      await refreshContent();
      addToast('success', 'About section saved', 'Admin override saved to database.');
    } catch (err: unknown) {
      console.error('Save about content error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to save changes', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefault = async () => {
    setResetting(true);
    try {
      const restored = await resetAboutContent();
      setForm({
        title: restored.title,
        description: restored.description,
        vision: restored.vision,
        objectives: restored.objectives,
      });
      await refreshContent();
      addToast('success', 'Original Content Restored', 'Admin override removed. Public page now displays default content.');
    } catch (err: unknown) {
      console.error('Reset about content error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast('error', 'Failed to restore default', msg);
    } finally {
      setResetting(false);
    }
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || resetting}
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
              onClick={() => { setForm(INITIAL); addToast('info', 'Reset Form', 'Form reset to original baseline.'); }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </button>
          </div>

          <button
            type="button"
            disabled={saving || resetting}
            onClick={handleRestoreDefault}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
            Restore Original Default
          </button>
        </div>
      </form>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
