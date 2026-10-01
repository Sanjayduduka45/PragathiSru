import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
  isReadOnly = false,
  onSuccess,
  onCancel,
}) => {
  // Initialize scores state: empty string for active evaluation, or stringified numbers for read-only
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    criteria.forEach((c) => {
      if (initialScores && initialScores[c.key] !== undefined) {
        s[c.key] = String(initialScores[c.key]);
      } else {
        s[c.key] = '';
      }
    });
    return s;
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation helper: returns error message if invalid, or null if valid (or empty while editing)
  const getFieldError = (key: string): string | null => {
    const val = scores[key];
    if (val === '' || val === undefined) return null; // blank while editing is allowed
    const num = Number(val);
    if (isNaN(num) || num < 0 || num > 20) {
      return 'Must be between 0 and 20';
    }
    return null;
  };

  const handleScoreChange = (key: string, rawVal: string) => {
    if (isReadOnly) return;
    setErrorMessage(null);

    // Allow blank while editing
    if (rawVal === '') {
      setScores((prev) => ({ ...prev, [key]: '' }));
      return;
    }

    // Only allow whole digits (strip letters, signs, decimals)
    const digitsOnly = rawVal.replace(/[^\d]/g, '');

    // Limit to at most 2 digits so user can enter 0..99 (DO NOT silently clamp 21 to 20!)
    const truncated = digitsOnly.slice(0, 2);

    setScores((prev) => ({ ...prev, [key]: truncated }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block e, E, +, -, ., ,, and non-digit characters on typing
    if (
      ['e', 'E', '+', '-', '.', ',', ' '].includes(e.key) ||
      (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey)
    ) {
      e.preventDefault();
    }
  };

  const handlePaste = (key: string, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const digits = pasteData.replace(/[^\d]/g, '').slice(0, 2);
    handleScoreChange(key, digits);
  };

  // Live Raw Total calculation: sums valid marks (0-20)
  const rawTotal = useMemo(() => {
    let sum = 0;
    for (const c of criteria) {
      const val = scores[c.key];
      if (val !== '' && val !== undefined) {
        const num = Number(val);
        if (!isNaN(num) && num >= 0 && num <= c.maxScore) {
          sum += num;
        }
      }
    }
    return sum;
  }, [scores, criteria]);

  // Check if all 5 criteria have valid marks entered (each between 0 and 20)
  const allFieldsFilledAndValid = useMemo(() => {
    return criteria.every((c) => {
      const val = scores[c.key];
      if (val === '' || val === undefined) return false;
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= c.maxScore;
    });
  }, [scores, criteria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || submitting) return;

    // Strict validation: every criterion must have a valid number between 0 and 20
    const parsedScores: Record<string, number> = {};

    for (const c of criteria) {
      const val = scores[c.key];

      if (val === '' || val === undefined) {
        setErrorMessage(`Please enter marks for "${c.label}". All 5 parameters are required.`);
        return;
      }

      const num = Number(val);
      if (isNaN(num)) {
        setErrorMessage(`Marks for "${c.label}" must be a valid number.`);
        return;
      }

      if (num < 0 || num > c.maxScore) {
        setErrorMessage(`Marks for "${c.label}" must be between 0 and ${c.maxScore}.`);
        return;
      }

      parsedScores[c.key] = num;
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
        scores: parsedScores,
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold">Evaluation submitted successfully.</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── DESKTOP & TABLET: 2-COLUMN TABLE (hidden on small mobile) ── */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3.5 px-4 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Evaluation Parameter
              </th>
              <th className="py-3.5 px-4 text-xs font-extrabold text-slate-700 uppercase tracking-wider text-right w-44">
                Marks
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criteria.map((c, index) => {
              const val = scores[c.key] ?? '';
              const fieldError = getFieldError(c.key);
              return (
                <tr key={c.key} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-4 align-middle">
                    <span className="font-semibold text-sm text-slate-900 leading-snug">
                      {index + 1}. {c.label}
                    </span>
                  </td>
                  <td className="py-4 px-4 align-middle text-right">
                    <div className="inline-flex flex-col items-end">
                      <div className="flex items-center justify-end gap-2">
                        {isReadOnly ? (
                          <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-block min-w-[3rem] text-center">
                            {val !== '' ? val : '—'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            maxLength={2}
                            value={val}
                            onChange={(e) => handleScoreChange(c.key, e.target.value)}
                            onKeyDown={handleKeyDown}
                            onPaste={(e) => handlePaste(c.key, e)}
                            placeholder="0–20"
                            aria-label={`Marks for ${c.label}`}
                            className={`h-11 w-20 text-center font-mono font-bold text-base rounded-lg border px-2 py-1.5 outline-none transition-all ${
                              fieldError
                                ? 'border-rose-500 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-200'
                                : 'border-slate-300 bg-white text-slate-900 focus:border-[#004182] focus:ring-2 focus:ring-[#004182]/20'
                            }`}
                          />
                        )}
                        <span className="font-mono font-bold text-sm text-slate-500 shrink-0">
                          / {c.maxScore}
                        </span>
                      </div>
                      {fieldError && !isReadOnly && (
                        <span className="text-[11px] font-bold text-rose-600 mt-1">
                          {fieldError}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/80 border-t-2 border-slate-200">
              <td className="py-3.5 px-4 font-black text-xs uppercase tracking-wider text-slate-700">
                TOTAL SCORE
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="inline-flex items-baseline justify-end gap-1 font-mono">
                  <span className="text-xl font-black text-[#004182]">
                    {rawTotal}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ 100</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── MOBILE: RESPONSIVELY STACKED CARDS (shown on small mobile screens) ── */}
      <div className="sm:hidden space-y-3">
        {criteria.map((c, index) => {
          const val = scores[c.key] ?? '';
          const fieldError = getFieldError(c.key);
          return (
            <div
              key={c.key}
              className={`p-3.5 bg-white rounded-xl border transition-colors ${
                fieldError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              <p className="font-semibold text-xs text-slate-900 leading-snug">
                {index + 1}. {c.label}
              </p>
              <div className="flex items-center justify-between gap-3 pt-2.5 mt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500">Marks:</span>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {isReadOnly ? (
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-block min-w-[3rem] text-center">
                        {val !== '' ? val : '—'}
                      </span>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        maxLength={2}
                        value={val}
                        onChange={(e) => handleScoreChange(c.key, e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={(e) => handlePaste(c.key, e)}
                        placeholder="0–20"
                        aria-label={`Marks for ${c.label}`}
                        className={`h-11 w-20 text-center font-mono font-bold text-base rounded-lg border px-2 py-1.5 outline-none transition-all ${
                          fieldError
                            ? 'border-rose-500 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-200'
                            : 'border-slate-300 bg-white text-slate-900 focus:border-[#004182] focus:ring-2 focus:ring-[#004182]/20'
                        }`}
                      />
                    )}
                    <span className="font-mono font-bold text-sm text-slate-500 shrink-0">
                      / {c.maxScore}
                    </span>
                  </div>
                  {fieldError && !isReadOnly && (
                    <span className="text-[11px] font-bold text-rose-600 mt-1">
                      {fieldError}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Total Score Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
            TOTAL SCORE
          </span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xl font-black text-[#004182]">
              {rawTotal}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      {!isReadOnly && !submitted && (
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
            disabled={submitting || !allFieldsFilledAndValid}
            className="flex items-center justify-center gap-2 bg-[#004182] hover:bg-[#003366] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 min-h-[44px] rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {submitting ? 'Submitting…' : 'Submit Evaluation'}
          </button>
        </div>
      )}
    </form>
  );
};
