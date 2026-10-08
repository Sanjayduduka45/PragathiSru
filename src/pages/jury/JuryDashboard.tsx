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
  Layers,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Project, Evaluation, Judge, DomainAssignmentItem, AssignedProjectItem } from '../../types';
import { EvaluationService } from '../../services/evaluationService';
import { JuryService } from '../../services/juryService';
import { QRScannerModal } from '../../components/judge/QRScannerModal';
import { ProjectEvaluationModal } from '../../components/judge/ProjectEvaluationModal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';
import { sessionManager } from '../../services/sessionManager';

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
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
              Submitted
            </span>
            <span className="text-slate-400">· {formatTime(existingEval.submittedAt)}</span>
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const JuryDashboard: React.FC = () => {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useAdminToast();

  // ── Core data state ──────────────────────────────────────────────────────────
  const [assignedProjects, setAssignedProjects] = useState<AssignedProjectItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]);
  const [assignedDomains, setAssignedDomains] = useState<DomainAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isFetchingRef = React.useRef(false);

  // ── Assigned projects search and status filter ──────────────────────────────
  const [projectSearch, setProjectSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'EVALUATED'>('ALL');

  // ── Helper to convert AssignedProjectItem to Project interface ───────────────
  const toProject = useCallback((ap: AssignedProjectItem): Project => ({
    id: ap.registration_id,
    registrationId: (ap.registration_id || '').toUpperCase(),
    teamName: ap.team_name,
    title: ap.project_title,
    category: ap.category,
    institutionName: ap.institution_name,
    leaderName: ap.leader_name,
    leaderEmail: ap.members?.find((m) => m.role === 'Leader')?.email || ap.members?.[0]?.email || '',
    members: (ap.members || []).map((m) => ({
      name: m.name,
      email: m.email,
      role: (m.role as 'Leader' | 'Member') || 'Member',
    })),
    problemStatement: ap.problem_statement || '',
    proposedSolution: ap.proposed_solution || '',
    innovation: ap.innovation || '',
    expectedOutcomes: ap.expected_outcomes || '',
    status: 'submitted',
  }), []);

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

  // ── Derived jury info ────────────────────────────────────────────────────────
  const juryEmail = user?.email || 'jury@sru.edu.in';
  const juryName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0]?.replace('.', ' ') ||
    'Jury Evaluator';

  // ── Load data via single Bootstrap call ──────────────────────────────────────
  const loadData = useCallback(async (bypassCache: boolean = false) => {
    if (!user?.id) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Fast-path: Check memory cache first
    if (!bypassCache) {
      const cached = JuryService.getCachedBootstrap(user.id);
      if (cached && Array.isArray(cached.projects)) {
        setAssignedProjects(cached.projects);
        setProjects(cached.projects.map(toProject));
        setMyEvaluations(cached.evaluations || []);
        if (Array.isArray(cached.assignments)) {
          setAssignedDomains(cached.assignments);
        }
        setLoading(false);
      }
    }

    try {
      setLoadError(null);
      let bootstrapRes = await JuryService.bootstrap(user.id);
      if (!bootstrapRes || !Array.isArray(bootstrapRes.projects)) {
        // Fallback to direct assigned-projects query if bootstrap yielded no projects array
        const directAssigned = await JuryService.getAssignedProjects();
        if (directAssigned && Array.isArray(directAssigned.projects)) {
          setAssignedProjects(directAssigned.projects);
          setProjects(directAssigned.projects.map(toProject));
        }
      } else {
        setAssignedProjects(bootstrapRes.projects);
        setProjects(bootstrapRes.projects.map(toProject));
        setMyEvaluations(bootstrapRes.evaluations || []);
        if (Array.isArray(bootstrapRes.assignments)) {
          setAssignedDomains(bootstrapRes.assignments);
        }
      }
    } catch (err: any) {
      console.error('[JuryDashboard] Bootstrap failed:', err);
      // Attempt secondary recovery via getAssignedProjects
      try {
        const directAssigned = await JuryService.getAssignedProjects();
        if (directAssigned && Array.isArray(directAssigned.projects)) {
          setAssignedProjects(directAssigned.projects);
          setProjects(directAssigned.projects.map(toProject));
          setLoadError(null);
        } else {
          setLoadError(err.message || 'Unable to load jury dashboard');
          addToast('error', 'Dashboard Notice', err.message || 'Unable to load jury dashboard.');
        }
      } catch {
        setLoadError(err.message || 'Unable to load jury dashboard');
        addToast('error', 'Dashboard Notice', err.message || 'Unable to load jury dashboard.');
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id, addToast, toProject]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
    const unsub = sessionManager.onRevalidate(() => {
      if (user?.id) {
        loadData();
      }
    });
    return unsub;
  }, [user?.id, loadData]);

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

  // ── Derived assigned domain titles (Authoritative: active jury_domain_assignments -> project_domains.title) ──
  const assignedDomainTitles = useMemo(() => {
    const titles: string[] = [];
    const seen = new Set<string>();
    assignedDomains.forEach((a) => {
      if (a.is_active !== false) {
        const title = (a.domain_title || '').trim();
        if (title && !seen.has(title)) {
          seen.add(title);
          titles.push(title);
        }
      }
    });
    return titles;
  }, [assignedDomains]);

  // ── Stats (Authoritative: calculated strictly from assigned-projects list) ───
  const totalProjects = assignedProjects.length;
  const completedCount = useMemo(() => {
    return assignedProjects.filter((p) => p.is_evaluated || myEvaluatedIds.has(p.registration_id.toUpperCase())).length;
  }, [assignedProjects, myEvaluatedIds]);
  const pendingCount = Math.max(0, totalProjects - completedCount);
  const progressPercent =
    totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;

  // ── Filtered assigned projects for the table/cards ───────────────────────────
  const filteredAssignedProjects = useMemo(() => {
    return assignedProjects.filter((item) => {
      const isEval = item.is_evaluated || myEvaluatedIds.has(item.registration_id.toUpperCase());

      // Status tab filter
      if (statusFilter === 'PENDING' && isEval) return false;
      if (statusFilter === 'EVALUATED' && !isEval) return false;

      // Text search filter
      if (projectSearch.trim()) {
        const q = projectSearch.trim().toLowerCase();
        const matchesRegId = item.registration_id.toLowerCase().includes(q);
        const matchesTitle = (item.project_title || '').toLowerCase().includes(q);
        const matchesTeam = (item.team_name || '').toLowerCase().includes(q);
        const matchesDomain = (item.domain_title || item.category || '').toLowerCase().includes(q);
        return matchesRegId || matchesTitle || matchesTeam || matchesDomain;
      }

      return true;
    });
  }, [assignedProjects, statusFilter, projectSearch, myEvaluatedIds]);

  // ── Recent evaluations (last 4) ───────────────────────────────────────────────
  const recentEvaluations = useMemo(() => myEvaluations.slice(0, 4), [myEvaluations]);

  // ── Project lookup helper (Server Authoritative) ──────────────────────────────
  const resolveProject = useCallback(
    async (registrationId: string): Promise<Project | null> => {
      let cleanId = registrationId.trim().toUpperCase();
      if (cleanId.startsWith('PRAGATHI-') && !cleanId.startsWith('PRAGATHI26-')) {
        cleanId = cleanId.replace('PRAGATHI-', 'PRAGATHI26-');
      }

      // Authoritative check via assigned project endpoint (GET /api/jury/assigned-projects/{id})
      try {
        const item = await JuryService.getAssignedProjectById(cleanId);
        if (item) {
          return toProject(item);
        }
      } catch (err: any) {
        console.warn('[JuryDashboard] Project assignment verification:', err);
        throw err;
      }

      // Check current in-memory assigned projects
      const cleanBare = cleanId.replace('PRAGATHI26-', '').replace('PRAGATHI-', '');
      const assignedItem = assignedProjects.find((p) => {
        const pReg = p.registration_id.toUpperCase();
        const pBare = pReg.replace('PRAGATHI26-', '').replace('PRAGATHI-', '');
        return pReg === cleanId || (cleanBare && pBare === cleanBare);
      });

      if (assignedItem) {
        return toProject(assignedItem);
      }

      return null;
    },
    [assignedProjects, toProject]
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
            'Access Denied',
            'This project is not assigned to you for evaluation. Please evaluate the assigned projects only.'
          );
        }
      } catch (err: any) {
        addToast(
          'error',
          'Access Denied',
          err.message?.includes('not assigned') || err.message?.includes('Access denied')
            ? 'This project is not assigned to you for evaluation. Please evaluate the assigned projects only.'
            : (err.message || 'This project is not assigned to you for evaluation. Please evaluate the assigned projects only.')
        );
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

    // Accept bare codes or full PRAGATHI26-XXXXXX
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
        setLookupError('This project is not assigned to you for evaluation. Please evaluate the assigned projects only.');
      }
    } catch (err: any) {
      setLookupError(
        err.message?.includes('not assigned') || err.message?.includes('Access denied')
          ? 'This project is not assigned to you for evaluation. Please evaluate the assigned projects only.'
          : (err.message || 'This project is not assigned to you for evaluation. Please evaluate the assigned projects only.')
      );
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Open evaluation modal (Server Authoritative) ──────────────────────────────
  const handleOpenEvaluation = async (project: Project) => {
    try {
      // Authoritative check: verify server assignment before opening evaluation modal
      await JuryService.getAssignedProjectById(project.registrationId);
      setSelectedProject(project);
      setEvalModalOpen(true);
    } catch (err: any) {
      addToast(
        'error',
        'Access Denied',
        err.message?.includes('not assigned') || err.message?.includes('Access denied')
          ? 'This project is not assigned to you for evaluation. Please evaluate the assigned projects only.'
          : (err.message || 'This project is not assigned to you for evaluation. Please evaluate the assigned projects only.')
      );
    }
  };

  // ── Evaluation submitted ──────────────────────────────────────────────────────
  const handleEvaluationSubmitted = (newEval: Evaluation) => {
    setMyEvaluations((prev) => {
      const filtered = prev.filter(
        (e) => e.registrationId.toUpperCase() !== newEval.registrationId.toUpperCase()
      );
      return [newEval, ...filtered];
    });

    // Synchronize authoritative assignedProjects status
    setAssignedProjects((prev) =>
      prev.map((item) => {
        if (item.registration_id.toUpperCase() === newEval.registrationId.toUpperCase()) {
          return {
            ...item,
            is_evaluated: true,
            evaluation_status: 'EVALUATED',
            total_score: newEval.totalScore,
            submitted_at: newEval.submittedAt,
            evaluation_id: newEval.id,
          };
        }
        return item;
      })
    );

    // Update found project eval if the confirmation card is still visible
    if (
      foundProject &&
      foundProject.registrationId.toUpperCase() === newEval.registrationId.toUpperCase()
    ) {
      setFoundProjectEval(newEval);
    }
    addToast(
      'success',
      'Evaluation Submitted',
      `Evaluation for ${newEval.teamName} has been recorded.`
    );
    setEvalModalOpen(false);
  };

  const handleSignOut = async () => {
    JuryService.clearBootstrapCache();
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

        {/* Error state with retry */}
        {loadError && projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 flex flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-rose-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Unable to load jury dashboard</h3>
            <p className="text-xs text-slate-500 max-w-sm">{loadError}</p>
            <button
              onClick={() => loadData(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
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

                      {/* Dynamic Assigned Domain(s) from project_domains.title */}
                      <div className="mt-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          {assignedDomainTitles.length > 1 ? 'Assigned Domains' : 'Assigned Domain'}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {loading ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 animate-pulse">
                              Loading domain...
                            </span>
                          ) : assignedDomainTitles.length > 0 ? (
                            assignedDomainTitles.map((title) => (
                              <span
                                key={title}
                                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#004182]/10 text-[#004182] border border-[#004182]/20 shadow-2xs"
                              >
                                {title}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No domain assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats pills: show '—' while loading */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-lg font-black text-slate-800">{loading ? '—' : totalProjects}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assigned Projects</p>
                      </div>
                      <div className="text-center px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                        <p className="text-lg font-black text-emerald-700">{loading ? '—' : completedCount}</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Evaluated</p>
                      </div>
                      <div className="text-center px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-lg font-black text-amber-700">{loading ? '—' : pendingCount}</p>
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

            {/* ── ASSIGNED PROJECTS & TEAMS LIST ────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Section Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Assigned Projects &amp; Teams
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-blue-50 text-[#004182] border border-blue-200">
                      {totalProjects}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Projects officially allocated to your jury panel for evaluation.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All ({totalProjects})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'PENDING'
                        ? 'bg-amber-100/80 text-amber-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('EVALUATED')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === 'EVALUATED'
                        ? 'bg-emerald-100/80 text-emerald-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Evaluated ({completedCount})
                  </button>
                </div>
              </div>

              {/* Search Bar (if more than 2 projects or active search) */}
              {(totalProjects > 2 || projectSearch) && (
                <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Filter by Registration ID, title, team, or domain..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004182]/20 focus:border-[#004182] transition-all"
                    />
                    {projectSearch && (
                      <button
                        onClick={() => setProjectSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Content Area */}
              {loading && assignedProjects.length === 0 ? (
                <div className="p-8 space-y-3">
                  <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                  <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                  <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                </div>
              ) : assignedProjects.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No Projects Currently Assigned</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Your jury account does not have any assigned domains or projects yet. Please contact event administrators.
                  </p>
                </div>
              ) : filteredAssignedProjects.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs font-semibold text-slate-500">
                    No projects match your current search/filter.
                  </p>
                  <button
                    onClick={() => {
                      setProjectSearch('');
                      setStatusFilter('ALL');
                    }}
                    className="mt-2 text-xs font-bold text-[#004182] hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredAssignedProjects.map((item) => {
                    const isEval = item.is_evaluated || myEvaluatedIds.has(item.registration_id.toUpperCase());
                    const existingEval = myEvalMap.get(item.registration_id.toUpperCase()) || null;
                    const totalScore = existingEval ? existingEval.totalScore : item.total_score;

                    return (
                      <div
                        key={item.registration_id}
                        className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isEval ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Left info */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Registration ID */}
                            <span className="font-mono text-xs font-black text-[#004182] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                              {item.registration_id}
                            </span>

                            {/* Domain Pill */}
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 max-w-[220px] truncate"
                              title={item.domain_title || item.category}
                            >
                              {item.domain_title || item.category}
                            </span>

                            {/* Evaluation Status Badge */}
                            {isEval ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                Evaluated
                                {totalScore !== null && totalScore !== undefined && (
                                  <span className="font-mono ml-0.5 font-black text-emerald-900">
                                    ({totalScore}/100)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                Pending
                              </span>
                            )}
                          </div>

                          {/* Title & Team */}
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                              {item.project_title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Team: <span className="font-bold text-slate-800">{item.team_name}</span>
                              {item.institution_name && (
                                <span className="text-slate-400"> · {item.institution_name}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Right Action Button */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isEval ? (
                            <button
                              onClick={() => {
                                const proj = toProject(item);
                                handleOpenEvaluation(proj);
                              }}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
                            >
                              <Award className="w-3.5 h-3.5 text-emerald-600" />
                              View Evaluation
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const proj = toProject(item);
                                handleOpenEvaluation(proj);
                              }}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#004182] hover:bg-[#003366] rounded-xl transition-colors cursor-pointer shadow-sm"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-300" />
                              Start Evaluation
                              <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
