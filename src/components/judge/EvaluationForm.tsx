import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Minus,
  Plus,
  Info,
} from 'lucide-react';
import { EvaluationCriterion, Evaluation } from '../../types';
import { EvaluationService, DEFAULT_EVALUATION_CRITERIA } from '../../services/evaluationService';

interface EvaluationFormProps {
  registrationId: string;
  projectTitle: string;
  teamName: string;
  category: string;
  judgeId?: string;
  judgeName: string;
  judgeEmail: string;
  criteria?: EvaluationCriterion[];
  initialScores?: Record<string, number>;
  initialComments?: string;
  isReadOnly?: boolean;
  onSuccess?: (evaluation: Evaluation) => void;
  onCancel?: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  registrationId,
  projectTitle,
  teamName,
  category,
  judgeId,
  judgeName,
  judgeEmail,
  criteria = DEFAULT_EVALUATION_CRITERIA,
  initialScores,
  initialComments = '',
  isReadOnly = false,
  onSuccess,
  onCancel,
}) => {
  // Initialize scores state (default to 15 for each criterion if not specified)
  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (initialScores) return initialScores;
    const defaults: Record<string, number> = {};
    criteria.forEach((c) => {
      defaults[c.key] = 15;
    });
    return defaults;
  });

  const [comments, setComments] = useState(initialComments);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute live total score
  const totalScore = useMemo(() => {
    return Object.values(scores).reduce<number>((sum: number, v: number) => sum + (Number(v) || 0), 0);
  }, [scores]);

  const handleScoreChange = (key: string, maxScore: number, val: number) => {
    if (isReadOnly) return;
    const clamped = Math.min(maxScore, Math.max(0, val));
    setScores((prev) => ({ ...prev, [key]: clamped }));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || submitting) return;

    // Validate score ranges
    for (const c of criteria) {
      const score = scores[c.key] ?? 0;
      if (score < 0 || score > c.maxScore) {
        setErrorMessage(`Score for ${c.label} must be between 0 and ${c.maxScore}.`);
        return;
      }
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await EvaluationService.submitEvaluation({
        registrationId,
        projectTitle,
        teamName,
        category,
        judgeId,
        judgeName,
        judgeEmail,
        scores,
        comments,
      });

      if (res.success && res.evaluation) {
        setSubmitted(true);
        onSuccess?.(res.evaluation);
      } else {
        setErrorMessage(res.error || 'Failed to submit evaluation.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold">Evaluation submitted successfully.</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Criteria Scoring Inputs */}
      <div className="space-y-3">
        {criteria.map((c) => {
          const currentScore = scores[c.key] ?? 0;
          return (
            <div
              key={c.key}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{c.label}</h4>
                  <p className="text-[10px] text-slate-400">{c.description}</p>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-base font-extrabold text-[#004182]">{currentScore}</span>
                  <span className="text-xs text-slate-400 font-bold">/ {c.maxScore}</span>
                </div>
              </div>

              {/* Slider + Stepper controls */}
              {!isReadOnly && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleScoreChange(c.key, c.maxScore, currentScore - 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="range"
                    min="0"
                    max={c.maxScore}
                    step="1"
                    value={currentScore}
                    onChange={(e) => handleScoreChange(c.key, c.maxScore, parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#004182] h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => handleScoreChange(c.key, c.maxScore, currentScore + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Auto-Calculated Total Bar */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Total Evaluation Score
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Calculated automatically across all 5 criteria</p>
        </div>
        <div className="text-right font-mono">
          <span className="text-2xl font-black text-amber-400">{totalScore}</span>
          <span className="text-xs font-bold text-slate-400"> / 100</span>
        </div>
      </div>

      {/* Comments & Feedback */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Judge Comments & Feedback {isReadOnly ? '' : '(Optional)'}
        </label>
        {isReadOnly ? (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 italic">
            {comments || 'No written comments provided.'}
          </div>
        ) : (
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share specific feedback, strengths, prototype observations, or suggestions..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-white"
          />
        )}
      </div>

      {/* Form Buttons */}
      {!isReadOnly && !submitted && (
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-60 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Submit Evaluation ({totalScore}/100)
          </button>
        </div>
      )}
    </form>
  );
};
