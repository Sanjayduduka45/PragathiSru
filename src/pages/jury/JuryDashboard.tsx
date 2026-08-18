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
import { Project, Evaluation, Judge } from '../../types';
import { ProjectService } from '../../services/projectService';
import { EvaluationService } from '../../services/evaluationService';
import { PROJECT_CATEGORIES } from '../../data/eventData';
import { QRScannerModal } from '../../components/judge/QRScannerModal';
import { ProjectEvaluationModal } from '../../components/judge/ProjectEvaluationModal';
import { ToastContainer } from '../../components/ui/Toast';
import { useAdminToast } from '../../hooks/useAdminToast';

const sruLogo = '/B4240911-4EF0-4DE3-8093-B50A0D0EA744_4_5005_c.jpeg';

export const JuryDashboard: React.FC = () => {
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

  const juryEmail = user?.email || 'jury@sru.edu.in';
  const juryName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0].replace('.', ' ') ||
    'Jury Evaluator';

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
      addToast('error', 'Load Error', 'Could not refresh projects list.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, juryEmail, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set of registration IDs evaluated by this jury member
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
  const progressPercent = totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;

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
  }, [projects, myEvaluatedIds, activeTab, categoryFilter, searchTerm]);

  // Handle opening evaluation modal
  const handleOpenEvaluation = (project: Project) => {
    setSelectedProject(project);
    setEvalModalOpen(true);
  };

  // Handle QR code scan result
  const handleQRScanSuccess = (project: Project) => {
    setScannerOpen(false);
    handleOpenEvaluation(project);
    addToast('success', 'Project Located', `Ready to evaluate ${project.teamName} (${project.registrationId}).`);
  };

  // Handle successful evaluation submission
  const handleEvaluationSubmitted = (newEval: Evaluation) => {
    setMyEvaluations((prev) => {
      const filtered = prev.filter((e) => e.registrationId.toUpperCase() !== newEval.registrationId.toUpperCase());
      return [newEval, ...filtered];
    });
    addToast('success', 'Scorecard Submitted', `Evaluation for ${newEval.teamName} has been recorded.`);
    setEvalModalOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const currentJuryObj: Judge = useMemo(() => ({
    id: user?.id || 'jury-current',
    userId: user?.id,
    name: juryName,
    email: juryEmail,
    department: (user?.user_metadata?.department as string) || 'Jury Panel',
    isActive: true,
    evaluationsCompleted: completedCount,
  }), [user, juryName, juryEmail, completedCount]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <ToastContainer toasts={toasts} dismissToast={dismissToast} />

      {/* ── TOP HEADER / NAVBAR ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img src={sruLogo} alt="SR University" className="h-9 w-auto object-contain rounded-sm" />
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
                National Level Project Expo &bull; SR University
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{juryName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">{juryEmail}</p>
            </div>

            {/* Scan QR Button */}
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-[#004182] to-blue-700 hover:from-[#003366] hover:to-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Scan Project QR Code"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {/* Logout Button */}
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

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Welcome Banner & Quick Stats */}
        <div className="bg-gradient-to-r from-[#004182] via-[#004182] to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 transform origin-top-right pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Jury Scorecard Panel</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Welcome, {juryName}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                Evaluate student projects across Innovation, Technical Depth, Problem Relevance, Presentation, and Feasibility.
              </p>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-3 shrink-0 bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="text-center px-3 py-1.5">
                <p className="text-xl sm:text-2xl font-black text-white">{totalProjects}</p>
                <p className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-wider mt-0.5">
                  Projects
                </p>
              </div>
              <div className="text-center px-3 py-1.5 border-x border-white/15">
                <p className="text-xl sm:text-2xl font-black text-emerald-300">{completedCount}</p>
                <p className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-wider mt-0.5">
                  Evaluated
                </p>
              </div>
              <div className="text-center px-3 py-1.5">
                <p className="text-xl sm:text-2xl font-black text-amber-300">{pendingCount}</p>
                <p className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-wider mt-0.5">
                  Pending
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-5 border-t border-white/15">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-blue-100">Evaluation Progress</span>
              <span className="text-white">{completedCount} of {totalProjects} Projects ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── CONTROLS & FILTER BAR ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          {/* Top Row: Search & Status Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by team, title, or ID (e.g. PRAGATHI26-000001)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#004182]/20 focus:border-[#004182] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-[#004182] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({totalProjects})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'completed'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Evaluated ({completedCount})
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Category:
            </span>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-[#004182] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Domains
            </button>
            {PROJECT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.title)}
                className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-all cursor-pointer ${
                  categoryFilter.toLowerCase() === cat.title.toLowerCase()
                    ? 'bg-[#004182] text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* ── PROJECTS LIST / GRID ─────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#004182] animate-spin" />
            <p className="text-xs font-bold text-slate-600">Loading project directory...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || categoryFilter !== 'ALL' || activeTab !== 'all'
                ? 'No projects match your current filter criteria. Try resetting filters.'
                : 'No projects have registered yet.'}
            </p>
            {(searchTerm || categoryFilter !== 'ALL' || activeTab !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('ALL');
                  setActiveTab('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const isEvaluated = myEvaluatedIds.has(project.registrationId.toUpperCase());
              const evalScore = myScoreMap.get(project.registrationId.toUpperCase());

              return (
                <div
                  key={project.id || project.registrationId}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                    isEvaluated ? 'border-emerald-200/80 bg-emerald-50/10' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="p-5 space-y-3">
                    {/* Card Top: ID and Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-extrabold bg-slate-100 text-[#004182] px-2 py-0.5 rounded-md border border-slate-200">
                        {project.registrationId}
                      </span>
                      {isEvaluated ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Score: {evalScore}/100</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )}
                    </div>

                    {/* Project Title */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Team: <span className="text-slate-800 font-bold">{project.teamName}</span>
                      </p>
                    </div>

                    {/* Category Badge */}
                    <div>
                      <span className="inline-block text-[10px] font-bold bg-blue-50 text-[#004182] border border-blue-100 px-2 py-0.5 rounded-md">
                        {project.category}
                      </span>
                    </div>

                    {/* Metadata summary */}
                    <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{project.institutionName || 'SR University'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Leader: {project.leaderName} ({project.members?.length || 1} members)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isEvaluated ? (
                      <button
                        onClick={() => handleOpenEvaluation(project)}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Scorecard</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenEvaluation(project)}
                        className="w-full py-2 px-3 bg-[#004182] hover:bg-[#003366] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-300" />
                        <span>Evaluate Project</span>
                        <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
      {/* 1. QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* 2. Project Evaluation Scorecard Modal */}
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
