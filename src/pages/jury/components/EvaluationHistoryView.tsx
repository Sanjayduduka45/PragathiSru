import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Award,
  X,
} from 'lucide-react';
import { Evaluation } from '../../../types';
import { DEFAULT_EVALUATION_CRITERIA } from '../../../services/evaluationService';

interface EvaluationHistoryViewProps {
  evaluations: Evaluation[];
  onBack: () => void;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '—';
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-700';
  if (score >= 70) return 'text-blue-700';
  if (score >= 50) return 'text-amber-700';
  return 'text-rose-700';
}

function scoreBg(score: number): string {
  if (score >= 85) return 'bg-emerald-50 border-emerald-200';
  if (score >= 70) return 'bg-blue-50 border-blue-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-rose-50 border-rose-200';
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  evaluation: Evaluation;
  onClose: () => void;
}

const EvaluationDetailPanel: React.FC<DetailPanelProps> = ({ evaluation, onClose }) => {
  const criteria = DEFAULT_EVALUATION_CRITERIA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evaluation Details</p>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5 leading-tight">{evaluation.projectTitle}</h3>
            <p className="font-mono text-[11px] font-bold text-[#004182] mt-0.5">{evaluation.registrationId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {/* Team info */}
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Team:</span>
            <span className="text-xs font-bold text-slate-900">{evaluation.teamName}</span>
            {evaluation.category && (
              <span className="ml-auto text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-md">
                {evaluation.category}
              </span>
            )}
          </div>

          {/* Per-criterion scores */}
          <div className="space-y-2">
            {criteria.map((c) => {
              const score = evaluation.scores?.[c.key] ?? 0;
              const pct = Math.round((score / c.maxScore) * 100);
              return (
                <div key={c.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">{c.label}</span>
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      {score}
                      <span className="text-slate-400 font-medium">/{c.maxScore}</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#004182] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className={`flex items-center justify-between p-3.5 rounded-xl border ${scoreBg(evaluation.totalScore)} mt-2`}>
            <span className="text-xs font-bold text-slate-700">Total Score</span>
            <span className={`text-lg font-black font-mono ${scoreColor(evaluation.totalScore)}`}>
              {evaluation.totalScore}
              <span className="text-xs font-bold text-slate-400">/100</span>
            </span>
          </div>

          {/* Comments */}
          {evaluation.comments && (
            <div className="pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Comments</p>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                {evaluation.comments}
              </p>
            </div>
          )}

          {/* Submitted At */}
          <div className="pt-1 pb-1">
            <p className="text-[10px] text-slate-400">
              Evaluated on{' '}
              <span className="font-semibold text-slate-500">
                {formatDate(evaluation.submittedAt)}, {formatDateTime(evaluation.submittedAt)}
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── History Row ───────────────────────────────────────────────────────────────

interface HistoryRowProps {
  evaluation: Evaluation;
  onClick: () => void;
}

const HistoryRow: React.FC<HistoryRowProps> = ({ evaluation, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 group"
  >
    {/* Score badge */}
    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${scoreBg(evaluation.totalScore)}`}>
      <span className={`text-sm font-black font-mono ${scoreColor(evaluation.totalScore)}`}>
        {evaluation.totalScore}
      </span>
    </div>

    {/* Project info */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 truncate leading-tight">{evaluation.projectTitle}</p>
      <p className="font-mono text-[11px] font-semibold text-slate-500 mt-0.5">{evaluation.registrationId}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
        <span className="text-[10px] font-semibold text-emerald-700">Evaluated</span>
        <span className="text-[10px] text-slate-300 mx-0.5">·</span>
        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
        <span className="text-[10px] text-slate-400">{formatDateTime(evaluation.submittedAt)}</span>
      </div>
    </div>

    {/* Arrow */}
    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
  </button>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export const EvaluationHistoryView: React.FC<EvaluationHistoryViewProps> = ({
  evaluations,
  onBack,
}) => {
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#004182] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">Evaluation History</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} completed</p>
        </div>
      </div>

      {/* List */}
      {evaluations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">No evaluations yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Scan a project QR or enter a Registration ID to start evaluating.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {evaluations.map((ev) => (
            <HistoryRow
              key={ev.id}
              evaluation={ev}
              onClick={() => setSelectedEval(ev)}
            />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedEval && (
        <EvaluationDetailPanel
          evaluation={selectedEval}
          onClose={() => setSelectedEval(null)}
        />
      )}
    </div>
  );
};
