import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  LogOut,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Project, Evaluation, Judge } from '../../types';
import { ProjectService } from '../../services/projectService';
import { EvaluationService } from '../../services/evaluationService';
import { QRScannerModal } from '../../components/judge/QRScannerModal';
import { ProjectEvaluationModal } from '../../components/judge/ProjectEvaluationModal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';
import { EvaluationHistoryView } from './components/EvaluationHistoryView';

const sruLogo = '/B4240911-4EF0-4DE3-8093-B50A0D0EA744_4_5005_c.jpeg';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-700';
  if (score >= 70) return 'text-[#004182]';
  if (score >= 50) return 'text-amber-700';
  return 'text-rose-700';
}

// ─── Project Confirmation Card ────────────────────────────────────────────────

interface ProjectConfirmCardProps {
  project: Project;
  existingEval: Evaluation | null;
  onStartEvaluation: () => void;
  onViewEvaluation: () => void;
  onDismiss: () => void;
}

const ProjectConfirmCard: React.FC<ProjectConfirmCardProps> = ({
  project,
  existingEval,
  onStartEvaluation,
  onViewEvaluation,
  onDismiss,
}) => {
  const isEvaluated = existingEval !== null;

  return (
    <div
      className={`rounded-2xl border p-5 space-y-4 ${
        isEvaluated
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-[#004182]/20 shadow-sm'
      }`}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between gap-2">
        {isEvaluated ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              Already Evaluated
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#004182] animate-pulse" />
            <span className="text-xs font-bold text-[#004182] uppercase tracking-wide">
              Project Found
            </span>
          </div>
        )}
        <button
          onClick={onDismiss}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Project info */}
      <div className="space-y-1">
        <p className="font-mono text-xs font-extrabold text-slate-500">
          {project.registrationId}
        </p>
        <h3 className="text-base font-extrabold text-slate-900 leading-tight">
          {project.title}
        </h3>
        <p className="text-xs text-slate-500">
          Team:{' '}
          <span className="font-bold text-slate-800">{project.teamName}</span>
        </p>
        {isEvaluated && existingEval && (
          <div className="flex items-center gap-3 pt-1">
            <span
              className={`text-sm font-black font-mono ${scoreColor(existingEval.totalScore)}`}
            >
              Score: {existingEval.totalScore}
              <span className="text-slate-400 font-bold text-xs">/100</span>
            </span>
            <span className="text-[11px] text-slate-400">
              · {formatTime(existingEval.submittedAt)}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="pt-1">
        {isEvaluated ? (
          <button
            onClick={onViewEvaluation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-colors"
          >
            <Award className="w-4 h-4" />
            View Evaluation
          </button>
        ) : (
          <button
            onClick={onStartEvaluation}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <Award className="w-4 h-4 text-amber-300" />
            Start Evaluation
            <ArrowRight className="w-4 h-4 text-blue-200" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Recent Evaluation Row ────────────────────────────────────────────────────

interface RecentEvalRowProps {
  evaluation: Evaluation;
  onClick: () => void;
}

const RecentEvalRow: React.FC<RecentEvalRowProps> = ({ evaluation, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left flex items-center gap-3 py-3 px-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors group"
  >
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-900 truncate">{evaluation.projectTitle}</p>
      <p className="font-mono text-[11px] text-slate-400 mt-0.5">{evaluation.registrationId}</p>
    </div>
    <div className="text-right shrink-0">
      <p className={`text-sm font-black font-mono ${scoreColor(evaluation.totalScore)}`}>
        {evaluation.totalScore}
        <span className="text-[10px] text-slate-400 font-bold">/100</span>
      </p>
      <div className="flex items-center justify-end gap-1 mt-0.5">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-semibold text-emerald-700">Evaluated</span>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
  </button>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const JuryDashboard: React.FC = () => {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useAdminToast();

  // ── Core data state ──────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Lookup state ─────────────────────────────────────────────────────────────
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // ── Found project (after QR or manual lookup) ────────────────────────────────
  const [foundProject, setFoundProject] = useState<Project | null>(null);
  const [foundProjectEval, setFoundProjectEval] = useState<Evaluation | null>(null);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [scannerOpen, setScannerOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // ── History view ─────────────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [historySelectedEval, setHistorySelectedEval] = useState<Evaluation | null>(null);

  // ── Derived jury info ────────────────────────────────────────────────────────
  const juryEmail = user?.email || 'jury@sru.edu.in';
  const juryName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0]?.replace('.', ' ') ||
    'Jury Evaluator';

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allProjects, evals] = await Promise.all([
        ProjectService.getProjects(),
        EvaluationService.getEvaluationsByJudge(user?.id || juryEmail),
      ]);
      setProjects(allProjects);
      setMyEvaluations(evals);
    } catch (err) {
      console.error('[JuryDashboard] Failed to load data:', err);
      addToast('error', 'Load Error', 'Could not refresh data.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, juryEmail, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived sets ─────────────────────────────────────────────────────────────
  const myEvaluatedIds = useMemo(
    () => new Set(myEvaluations.map((e) => e.registrationId.toUpperCase())),
    [myEvaluations]
  );

  const myEvalMap = useMemo(() => {
    const map = new Map<string, Evaluation>();
    myEvaluations.forEach((e) => map.set(e.registrationId.toUpperCase(), e));
    return map;
  }, [myEvaluations]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalProjects = projects.length;
  const completedCount = myEvaluations.length;
  const pendingCount = Math.max(0, totalProjects - completedCount);
  const progressPercent =
    totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;

  // ── Recent evaluations (last 4) ───────────────────────────────────────────────
  const recentEvaluations = useMemo(() => myEvaluations.slice(0, 4), [myEvaluations]);

  // ── Project lookup helper ─────────────────────────────────────────────────────
  const resolveProject = useCallback(
    async (registrationId: string): Promise<Project | null> => {
      const cleanId = registrationId.trim().toUpperCase();

      // Try from already-loaded list first (fast path)
      const fromCache = projects.find(
        (p) => p.registrationId.toUpperCase() === cleanId
      );
      if (fromCache) return fromCache;

      // Fall back to direct DB lookup
      return ProjectService.getProjectByRegistrationId(cleanId);
    },
    [projects]
  );

  // ── Set found project with evaluation status ──────────────────────────────────
  const setFoundProjectWithEval = useCallback(
    (project: Project) => {
      setFoundProject(project);
      const existingEval = myEvalMap.get(project.registrationId.toUpperCase()) || null;
      setFoundProjectEval(existingEval);
    },
    [myEvalMap]
  );

  // ── QR scan handler ───────────────────────────────────────────────────────────
  const handleQRScanSuccess = useCallback(
    async (registrationId: string) => {
      setScannerOpen(false);
      setLookupError(null);
      setFoundProject(null);
      setFoundProjectEval(null);
      setLookupLoading(true);

      try {
        const project = await resolveProject(registrationId);
        if (project) {
          setFoundProjectWithEval(project);
          addToast('success', 'Project Located', `${project.title} — ${project.teamName}`);
        } else {
          addToast(
            'error',
            'Not Found',
            `No project found for ${registrationId}. Check the QR code.`
          );
        }
      } catch {
        addToast('error', 'Lookup Failed', 'Could not look up the project. Try again.');
      } finally {
        setLookupLoading(false);
      }
    },
    [resolveProject, setFoundProjectWithEval, addToast]
  );

  // ── Manual lookup ─────────────────────────────────────────────────────────────
  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = lookupId.trim();
    if (!raw) return;

    // Accept bare 6-char codes or full PRAGATHI26-XXXXXX
    const cleanId = /^PRAGATHI(?:26)?-/i.test(raw)
      ? raw.toUpperCase()
      : `PRAGATHI26-${raw.toUpperCase()}`;

    setLookupError(null);
    setFoundProject(null);
    setFoundProjectEval(null);
    setLookupLoading(true);

    try {
      const project = await resolveProject(cleanId);
      if (project) {
        setFoundProjectWithEval(project);
      } else {
        setLookupError(`No project found for "${cleanId}". Please verify the Registration ID.`);
      }
    } catch {
      setLookupError('Lookup failed. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Open evaluation modal ─────────────────────────────────────────────────────
  const handleOpenEvaluation = (project: Project) => {
    setSelectedProject(project);
    setEvalModalOpen(true);
  };

  // ── Evaluation submitted ──────────────────────────────────────────────────────
  const handleEvaluationSubmitted = (newEval: Evaluation) => {
    setMyEvaluations((prev) => {
      const filtered = prev.filter(
        (e) => e.registrationId.toUpperCase() !== newEval.registrationId.toUpperCase()
      );
      return [newEval, ...filtered];
    });
    // Update found project eval if the confirmation card is still visible
    if (
      foundProject &&
      foundProject.registrationId.toUpperCase() === newEval.registrationId.toUpperCase()
    ) {
      setFoundProjectEval(newEval);
    }
    addToast(
      'success',
      'Scorecard Submitted',
      `Evaluation for ${newEval.teamName} has been recorded.`
    );
    setEvalModalOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const currentJuryObj: Judge = useMemo(
    () => ({
      id: user?.id || 'jury-current',
      userId: user?.id,
      name: juryName,
      email: juryEmail,
      department: (user?.user_metadata?.department as string) || 'Jury Panel',
      isActive: true,
      evaluationsCompleted: completedCount,
    }),
    [user, juryName, juryEmail, completedCount]
  );

  // ── Recent eval click — open history eval detail ──────────────────────────────
  const handleRecentEvalClick = (ev: Evaluation) => {
    setHistorySelectedEval(ev);
    setShowHistory(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />

      {/* ── HEADER ─────────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src={sruLogo}
              alt="SR University"
              className="h-9 w-auto object-contain rounded-sm"
            />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-[#004182] tracking-tight">
                  PRAGATHI 2K26
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  Jury Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                National Level Project Expo · SR University
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{juryName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                {juryEmail}
              </p>
            </div>

            <button
              onClick={() => {
                setScannerOpen(true);
                setFoundProject(null);
                setFoundProjectEval(null);
                setLookupError(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              title="Scan Project QR Code"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-5">

        {/* Loading skeleton */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-[#004182] animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading dashboard...</p>
          </div>
        ) : showHistory ? (
          /* ── HISTORY VIEW ─────────────────────────────────────────────────── */
          <EvaluationHistoryView
            evaluations={myEvaluations}
            onBack={() => {
              setShowHistory(false);
              setHistorySelectedEval(null);
            }}
          />
        ) : (
          /* ── MAIN DASHBOARD ───────────────────────────────────────────────── */
          <>
            {/* ── WELCOME & PROGRESS ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Blue left accent strip */}
              <div className="flex">
                <div className="w-1 bg-[#004182] shrink-0" />
                <div className="flex-1 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Jury Scorecard Panel
                      </p>
                      <h2 className="text-base font-extrabold text-slate-900 mt-1">
                        Welcome, {juryName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Evaluate student projects efficiently.
                      </p>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-lg font-black text-slate-800">{totalProjects}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Projects</p>
                      </div>
                      <div className="text-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                        <p className="text-lg font-black text-emerald-700">{completedCount}</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Evaluated</p>
                      </div>
                      <div className="text-center px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-lg font-black text-amber-700">{pendingCount}</p>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Remaining</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {totalProjects > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                        <span className="text-slate-500">Evaluation Progress</span>
                        <span className="text-slate-700 font-bold">{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#004182] rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {completedCount} of {totalProjects} projects evaluated
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── PRIMARY ACTION AREA ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Section: Scan QR */}
              <div className="p-6 text-center border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-[#004182]/8 flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-7 h-7 text-[#004182]" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Scan Project QR</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs mx-auto">
                  Scan the QR code displayed at the project stall to begin evaluation.
                </p>
                <button
                  onClick={() => {
                    setScannerOpen(true);
                    setFoundProject(null);
                    setFoundProjectEval(null);
                    setLookupError(null);
                    setLookupId('');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Scan QR Code
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 px-6 py-3 bg-slate-50">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Section: Manual ID */}
              <div className="p-6 pt-4">
                <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  Enter Registration ID
                </h3>
                <form onSubmit={handleManualLookup} className="flex gap-2">
                  <input
                    type="text"
                    value={lookupId}
                    onChange={(e) => {
                      setLookupId(e.target.value);
                      setLookupError(null);
                    }}
                    placeholder="PRAGATHI26-XXXXXX"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004182]/20 focus:border-[#004182] text-xs font-mono font-bold uppercase tracking-wider transition-all"
                  />
                  <button
                    type="submit"
                    disabled={lookupLoading || !lookupId.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#004182] hover:bg-[#003366] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    {lookupLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {lookupLoading ? 'Looking up…' : 'Find Project'}
                  </button>
                </form>

                {lookupError && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{lookupError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── PROJECT CONFIRMATION CARD ────────────────────────────────────── */}
            {lookupLoading && !foundProject && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-[#004182] animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Looking up project…</p>
              </div>
            )}

            {foundProject && !lookupLoading && (
              <ProjectConfirmCard
                project={foundProject}
                existingEval={foundProjectEval}
                onStartEvaluation={() => handleOpenEvaluation(foundProject)}
                onViewEvaluation={() => handleOpenEvaluation(foundProject)}
                onDismiss={() => {
                  setFoundProject(null);
                  setFoundProjectEval(null);
                }}
              />
            )}

            {/* ── RECENT EVALUATIONS ───────────────────────────────────────────── */}
            {myEvaluations.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Evaluation History
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1 text-xs font-bold text-[#004182] hover:text-[#003366] transition-colors"
                  >
                    View All
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  {recentEvaluations.map((ev) => (
                    <RecentEvalRow
                      key={ev.id}
                      evaluation={ev}
                      onClick={() => handleRecentEvalClick(ev)}
                    />
                  ))}
                </div>

                {myEvaluations.length > 4 && (
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setShowHistory(true)}
                      className="text-xs font-bold text-[#004182] hover:text-[#003366] transition-colors"
                    >
                      + {myEvaluations.length - 4} more evaluations — View All History
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Empty state when no evals yet */}
            {!loading && myEvaluations.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-600">No evaluations yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Scan a project QR code or enter a Registration ID above to begin.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MODALS ─────────────────────────────────────────────────────────────── */}

      {/* QR Scanner */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* Project Evaluation Modal */}
      {selectedProject && (
        <ProjectEvaluationModal
          isOpen={evalModalOpen}
          onClose={() => {
            setEvalModalOpen(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          currentJudge={currentJuryObj}
          onEvaluationSubmitted={handleEvaluationSubmitted}
        />
      )}
    </div>
  );
};
