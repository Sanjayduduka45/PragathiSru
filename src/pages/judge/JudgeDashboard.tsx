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
  Building,
  Users,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
  Check,
  BookOpen,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Project, Evaluation } from '../../types';
import { ProjectService } from '../../services/projectService';
import { EvaluationService } from '../../services/evaluationService';
import { PROJECT_CATEGORIES } from '../../data/eventData';
import { QRScannerModal } from '../../components/judge/QRScannerModal';
import { ProjectEvaluationModal } from '../../components/judge/ProjectEvaluationModal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';

const sruLogo = '/B4240911-4EF0-4DE3-8093-B50A0D0EA744_4_5005_c.jpeg';

export const JudgeDashboard: React.FC = () => {
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useAdminToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const judgeEmail = user?.email || 'judge@sru.edu.in';
  const judgeName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0].replace('.', ' ') ||
    'Judge';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allProjects, evals] = await Promise.all([
        ProjectService.getProjects(),
        EvaluationService.getEvaluationsByJudge(judgeEmail),
      ]);
      setProjects(allProjects);
      setMyEvaluations(evals);
    } catch (err) {
      console.error('[JudgeDashboard] Failed to load data:', err);
      addToast('error', 'Load Error', 'Could not refresh projects list.');
    } finally {
      setLoading(false);
    }
  }, [judgeEmail, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set of registration IDs evaluated by this judge
  const myEvaluatedIds = useMemo(() => {
    return new Set(myEvaluations.map((e) => e.registrationId.toUpperCase()));
  }, [myEvaluations]);

  // Score map for quick lookup
  const myScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    myEvaluations.forEach((e) => map.set(e.registrationId.toUpperCase(), e.totalScore));
    return map;
  }, [myEvaluations]);

  // Stats calculation
  const totalProjects = projects.length;
  const completedCount = myEvaluations.length;
  const pendingCount = Math.max(0, totalProjects - completedCount);

  // Filter projects list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const isEvaluated = myEvaluatedIds.has(p.registrationId.toUpperCase());

      // Tab filter
      if (activeTab === 'pending' && isEvaluated) return false;
      if (activeTab === 'completed' && !isEvaluated) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && p.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Search keyword
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          p.teamName.toLowerCase().includes(query) ||
          p.registrationId.toLowerCase().includes(query) ||
          p.title.toLowerCase().includes(query) ||
          p.leaderName.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [projects, activeTab, categoryFilter, searchTerm, myEvaluatedIds]);

  // Handle QR Scan Result
  const handleQRScanSuccess = async (scannedRegId: string) => {
    setScannerOpen(false);
    const cleanId = scannedRegId.trim().toUpperCase();

    // 1. Check in loaded list
    let found = projects.find((p) => p.registrationId.toUpperCase() === cleanId);

    // 2. Query project service if not currently in state
    if (!found) {
      found = (await ProjectService.getProjectByRegistrationId(cleanId)) || undefined;
    }

    if (found) {
      setSelectedProject(found);
      setEvalModalOpen(true);
    } else {
      addToast(
        'error',
        'Project Not Found',
        `No PRAGATHI 2K26 project found for ID "${cleanId}". Please scan a valid project QR code.`
      );
    }
  };

  // Open Evaluate Modal directly from Project Card
  const handleOpenEvaluate = (proj: Project) => {
    setSelectedProject(proj);
    setEvalModalOpen(true);
  };

  const handleEvaluationSubmitted = (newEval: Evaluation) => {
    addToast('success', 'Scorecard Recorded', `Your evaluation for ${newEval.teamName} has been recorded.`);
    setMyEvaluations((prev) => [newEval, ...prev.filter((e) => e.registrationId !== newEval.registrationId)]);
    loadData();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-2xs px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src={sruLogo}
              alt="SR University Logo"
              className="h-8 sm:h-9 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[#004182] uppercase tracking-tight truncate">
                  PRAGATHI 2K26
                </span>
                <span className="text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                  Judge
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate capitalize">
                {judgeName}
              </p>
            </div>
          </div>

          {/* Sign Out Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Welcome & Primary QR Action Hero Banner */}
        <div className="bg-gradient-to-br from-[#003366] via-[#004182] to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-950/15 space-y-6 relative overflow-hidden">
          {/* Background Decorative Pattern */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-8 bottom-0 opacity-10 pointer-events-none">
            <Award className="w-48 h-48" />
          </div>

          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Evaluation Dashboard
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Welcome, {judgeName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl leading-relaxed">
              Scan project QR codes at team stalls or select projects from the directory below to submit criteria scorecards.
            </p>
          </div>

          {/* Large Primary Action Button */}
          <div className="relative z-10 pt-1">
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-black text-sm px-6 sm:px-8 py-3.5 rounded-2xl shadow-md shadow-amber-950/20 transition-all cursor-pointer group"
            >
              <QrCode className="w-5 h-5 text-slate-950 group-hover:rotate-6 transition-transform" />
              <span>SCAN PROJECT QR CODE</span>
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
            <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Available Projects
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {totalProjects}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">In expo directory</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
            <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              Completed
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700">
              {completedCount}
            </p>
            <p className="text-[10px] sm:text-xs text-emerald-600 font-medium">Evaluations submitted</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1 shadow-2xs">
            <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-600">
              Pending
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-700">
              {pendingCount}
            </p>
            <p className="text-[10px] sm:text-xs text-amber-600 font-medium">Awaiting scorecards</p>
          </div>
        </div>

        {/* Tabs, Search & Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-[#004182] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Projects ({totalProjects})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'completed'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Evaluations ({completedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search team, project, or ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors"
              />
            </div>
          </div>

          {/* Domain Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-[#004182] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {PROJECT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.title)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === c.title
                    ? 'bg-[#004182] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        {/* Project List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin mx-auto" />
            <p>Loading projects for evaluation...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Award className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {activeTab === 'completed'
                ? 'No evaluations submitted yet.'
                : totalProjects === 0
                ? 'No projects available for evaluation yet.'
                : 'No projects match your filter.'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {totalProjects === 0
                ? 'When projects are registered and assigned, they will appear here.'
                : 'Try clearing search filters or click "Scan Project QR" to evaluate.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((proj) => {
              const isEvaluated = myEvaluatedIds.has(proj.registrationId.toUpperCase());
              const myScore = myScoreMap.get(proj.registrationId.toUpperCase());

              return (
                <div
                  key={proj.registrationId}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm ${
                    isEvaluated
                      ? 'border-emerald-200/80 bg-emerald-50/15'
                      : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  {/* Left: Project Details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-extrabold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-full">
                        {proj.registrationId}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {proj.category}
                      </span>
                      {isEvaluated ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Evaluated ({myScore}/100)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {proj.teamName}
                    </h3>

                    <p className="text-xs font-semibold text-slate-600 leading-snug">
                      {proj.title}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Leader: <strong className="font-medium text-slate-700">{proj.leaderName}</strong> &bull; {proj.institutionName}
                    </p>
                  </div>

                  {/* Right: Evaluate / View Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {isEvaluated ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEvaluate(proj)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View My Evaluation
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenEvaluate(proj)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Evaluate Project
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* QR Code Camera Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* Project Scoring & Details Modal */}
      <ProjectEvaluationModal
        isOpen={evalModalOpen}
        onClose={() => {
          setEvalModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        currentJudge={{ name: judgeName, email: judgeEmail }}
        onEvaluationSubmitted={handleEvaluationSubmitted}
      />
    </div>
  );
};
