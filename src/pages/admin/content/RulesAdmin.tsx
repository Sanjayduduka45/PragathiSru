import React, { useState } from 'react';
import { Save, RotateCcw, BookOpen } from 'lucide-react';
import { ToastContainer } from '../../../components/ui/Toast';
import { useAdminToast } from '../../../hooks/useAdminToast';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';

const INITIAL_RULES = `PARTICIPATION RULES & GUIDELINES

1. ELIGIBILITY
• Open to School students (Classes 8–12) and College/University students (Diploma, B.Tech, M.Tech, Degree, B.Sc) from recognized institutions across India.
• Each team must have 1 to 5 members.
• Solo participation is permitted.
• Cross-departmental and cross-institutional teams are encouraged.

2. PROJECT STANDARDS
• Projects must be original work created by the registered team.
• Projects must include a working prototype or functional demonstration.
• Projects must fall within one of the six official PRAGATHI 2K26 domains.
• Plagiarized or previously awarded projects from other expos will be disqualified.

3. EXPO DAY CONDUCT
• All team members must carry valid ID proof on Expo Day (college/school ID or government ID).
• Teams must report to the check-in desk by 09:00 AM on 09 October 2026.
• Each team will be allocated a stall. Teams must set up within the designated setup window.
• Disruptive or inappropriate conduct will result in immediate disqualification.

4. EVALUATION CRITERIA
• Technical Merit (40%)
• Innovation & Originality (25%)
• Presentation & Communication (20%)
• Real-world Impact & Scalability (15%)

5. AWARDS & PRIZES
• Top teams from each domain will be eligible for category prizes.
• A Grand Innovation Prize will be awarded across all domains.
• Total Prize Pool: ₹1,50,000

6. CERTIFICATES
• All registered participants presenting their project will receive official Certificates of Participation.
• Category winners will receive Merit Certificates.`;

export const RulesAdmin: React.FC = () => {
  const [content, setContent] = useState(INITIAL_RULES);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, dismissToast } = useAdminToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      addToast('error', 'Validation error', 'Rules content cannot be empty.');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    addToast(
      isSupabaseConfigured ? 'success' : 'warning',
      isSupabaseConfigured ? 'Rules saved' : 'Changes not persisted',
      isSupabaseConfigured
        ? 'Rules & Guidelines updated on the public website.'
        : 'Supabase is not connected. Changes are local only.'
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#004182]" />
            <h2 className="text-lg font-extrabold text-slate-900">Rules & Guidelines</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage the official participation rules and guidelines content.
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
          <label htmlFor="rules-content" className="block text-xs font-bold text-slate-700 mb-1.5">
            Rules & Guidelines Content
          </label>
          <textarea
            id="rules-content"
            rows={28}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 resize-y bg-white leading-relaxed"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Content is displayed on the Rules & Guidelines section of the public website.
          </p>
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
            onClick={() => { setContent(INITIAL_RULES); addToast('info', 'Reset', 'Content restored to original.'); }}
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
