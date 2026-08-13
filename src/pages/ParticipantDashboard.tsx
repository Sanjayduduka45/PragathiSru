import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Users,
  Hash,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileImage,
  Ticket,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Tag,
  Lock,
  ChevronRight,
  Loader2,
  ExternalLink,
  Send,
  Edit3,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Check,
  Printer,
  Download,
} from 'lucide-react';
import { useParticipantAuth } from '../context/ParticipantAuthContext';
import type { ParticipantMember, ParticipantProfile } from '../context/ParticipantAuthContext';
import { PosterService } from '../services/posterService';
import type { PosterContent, PosterStatus } from '../services/posterService';
import { CanonicalPoster } from '../components/CanonicalPoster';

const sruLogo = '/B4240911-4EF0-4DE3-8093-B50A0D0EA744_4_5005_c.jpeg';

// ─── Status Badges ─────────────────────────────────────────────────────────────

const RegistrationStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toLowerCase();
  if (s === 'rejected')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
        <AlertCircle className="w-3.5 h-3.5" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
      <CheckCircle2 className="w-3.5 h-3.5" /> Registered
    </span>
  );
};

const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toLowerCase();
  if (s === 'not_required' || s === 'free_sru' || s === 'free')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> Free — SRU Student
      </span>
    );
  if (s === 'paid' || s === 'completed')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> Payment Confirmed
      </span>
    );
  if (s === 'pending')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
        <Clock className="w-3.5 h-3.5" /> Payment Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
      {status}
    </span>
  );
};

// ─── Member Avatar ──────────────────────────────────────────────────────────────

const MemberCard: React.FC<{ member: ParticipantMember; index: number }> = ({ member, index }) => {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avatarColors = [
    'bg-[#004182] text-white',
    'bg-violet-600 text-white',
    'bg-teal-600 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
  ];
  const colorClass = avatarColors[index % avatarColors.length];

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-colors duration-150">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${colorClass} shadow-sm`}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
              member.role === 'Leader'
                ? 'bg-[#004182] text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {member.role}
          </span>
        </div>
        {member.email && (
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{member.email}</span>
          </p>
        )}
        {(member.department || member.classOrYear) && (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3 shrink-0" />
            {[member.department, member.classOrYear].filter(Boolean).join(' • ')}
          </p>
        )}
        {member.phone && (
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Phone className="w-3 h-3 shrink-0" />
            {member.phone}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Coming Soon Card ──────────────────────────────────────────────────────────

const ComingSoonCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-slate-200 overflow-hidden group transition-all duration-200 hover:border-blue-200 hover:shadow-sm">
    {/* Coming soon ribbon */}
    <div className="absolute top-3 right-3">
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
        Coming Soon
      </span>
    </div>

    {/* Icon */}
    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-[#004182] transition-all duration-200">
      {icon}
      <Lock className="w-4 h-4 absolute opacity-0 group-hover:opacity-0" />
    </div>

    <h3 className="text-sm font-extrabold text-slate-700 mb-1">{title}</h3>
    <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
  </div>
);

// ─── Poster Submission Card ─────────────────────────────────────────────────────

const PosterCard: React.FC<{ profile: ParticipantProfile; registrationInternalId: string }> = ({
  profile,
  registrationInternalId,
}) => {
  const [posterStatus, setPosterStatus] = useState<PosterStatus | null>(null);
  const [posterLoading, setPosterLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Default registration values
  const defaultMembers = profile.members.map((m) => m.name).join(', ');
  const defaultDept = [
    profile.department || 'School of Engineering',
    profile.institutionName || 'SR University, Warangal',
  ].filter(Boolean).join(', ');

  const [fields, setFields] = useState<Partial<PosterContent>>({
    teamMembers: '',
    departmentDetails: '',
    introduction: '',
    methodology: '',
    conclusion: '',
    references: '',
    diagram1: '',
    diagram1Caption: '',
    diagram2: '',
    diagram2Caption: '',
    diagram3: '',
    diagram3Caption: '',
  });

  const buildContent = useCallback((): PosterContent => ({
    teamName: profile.teamName,
    projectTitle: profile.projectTitle,
    category: profile.category,
    institutionName: profile.institutionName,
    leaderName: profile.members.find((m) => m.role === 'Leader')?.name ?? profile.members[0]?.name ?? '',
    leaderEmail: profile.members.find((m) => m.role === 'Leader')?.email ?? profile.members[0]?.email ?? '',
    teamMembers: fields.teamMembers || defaultMembers,
    departmentDetails: fields.departmentDetails || defaultDept,
    introduction: fields.introduction || '',
    methodology: fields.methodology || '',
    conclusion: fields.conclusion || '',
    references: fields.references || '',
    diagram1: fields.diagram1 || '',
    diagram1Caption: fields.diagram1Caption || '',
    diagram2: fields.diagram2 || '',
    diagram2Caption: fields.diagram2Caption || '',
    diagram3: fields.diagram3 || '',
    diagram3Caption: fields.diagram3Caption || '',
  }), [profile, fields, defaultMembers, defaultDept]);

  // Load existing poster record on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const existing = await PosterService.getMyPoster(registrationInternalId);
      if (!mounted) return;
      if (existing) {
        setPosterStatus(existing.status);
        if (existing.posterContent) {
          setFields({
            teamMembers: existing.posterContent.teamMembers || defaultMembers,
            departmentDetails: existing.posterContent.departmentDetails || defaultDept,
            introduction: existing.posterContent.introduction || '',
            methodology: existing.posterContent.methodology || '',
            conclusion: existing.posterContent.conclusion || '',
            references: existing.posterContent.references || '',
            diagram1: existing.posterContent.diagram1 || '',
            diagram1Caption: existing.posterContent.diagram1Caption || '',
            diagram2: existing.posterContent.diagram2 || '',
            diagram2Caption: existing.posterContent.diagram2Caption || '',
            diagram3: fields.diagram3 || existing.posterContent.diagram3 || '',
            diagram3Caption: fields.diagram3Caption || existing.posterContent.diagram3Caption || '',
          });
        }
      } else {
        setPosterStatus(null);
        setFields({
          teamMembers: defaultMembers,
          departmentDetails: defaultDept,
          introduction: '',
          methodology: '',
          conclusion: '',
          references: '',
          diagram1: '',
          diagram1Caption: '',
          diagram2: '',
          diagram2Caption: '',
          diagram3: '',
          diagram3Caption: '',
        });
      }
      setPosterLoading(false);
    })();
    return () => { mounted = false; };
  }, [registrationInternalId, defaultMembers, defaultDept]);

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveMsg(null);
    const result = await PosterService.upsertPosterDraft(registrationInternalId, buildContent());
    setSaving(false);
    if (result.success) {
      setPosterStatus('draft');
      setSaveMsg('Draft saved successfully!');
      setTimeout(() => setSaveMsg(null), 3000);
    } else {
      setSaveMsg('Save failed. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSaveMsg(null);
    const result = await PosterService.submitPoster(registrationInternalId, buildContent());
    setSubmitting(false);
    if (result.success) {
      setPosterStatus('submitted');
      setEditorOpen(false);
    } else {
      setSaveMsg('Submission failed. Please try again.');
    }
  };

  const handleImageUpload = (key: 'diagram1' | 'diagram2' | 'diagram3', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFields((prev) => ({ ...prev, [key]: e.target.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Interactive scale factor calculation to fit presentation canvas nicely on viewport
  const [scale, setScale] = useState(0.6);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorOpen) return;
    const handleResize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.clientWidth;
      const newScale = Math.min((parentWidth - 40) / 960, 1.0);
      setScale(newScale);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    // Tiny timeout to make sure DOM is loaded
    const t = setTimeout(handleResize, 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [editorOpen]);

  if (posterLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-medium">Loading poster status…</span>
      </div>
    );
  }

  const isSubmitted = posterStatus === 'submitted';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Card Header */}
      <div className="p-4 flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          isSubmitted
            ? 'bg-emerald-50 border border-emerald-200'
            : posterStatus === 'draft'
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-slate-100 border border-slate-200'
        }`}>
          <FileImage className={`w-5 h-5 ${
            isSubmitted ? 'text-emerald-600' : posterStatus === 'draft' ? 'text-[#004182]' : 'text-slate-400'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-extrabold text-slate-900">Project Poster</h3>
            {isSubmitted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Submitted
              </span>
            )}
            {posterStatus === 'draft' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <Edit3 className="w-3 h-3" /> Draft Saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {isSubmitted
              ? 'Your official event poster has been submitted successfully.'
              : 'Complete your official project poster template and submit it to management.'}
          </p>
        </div>
      </div>

      {/* Main card trigger button */}
      <div className="px-4 pb-4">
        <button
          id="participant-poster-open-editor"
          type="button"
          onClick={() => setEditorOpen(true)}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#004182] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {isSubmitted ? 'View Submitted Poster' : posterStatus === 'draft' ? 'Edit Poster Draft' : 'Create Poster'}
        </button>
      </div>

      {/* Slide Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
          <div className="relative z-10 w-full max-w-5xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[92vh] overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#004182] flex items-center justify-center">
                  <FileImage className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">PRAGATHI 2K26 Poster Editor</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400">Status:</span>
                    {isSubmitted ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Submitted</span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Editable Draft</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!isSubmitted && (
                  <>
                    <button
                      id="participant-poster-save-draft"
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={saving || submitting}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                      Save Draft
                    </button>
                    <button
                      id="participant-poster-submit"
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving || submitting}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#004182] hover:bg-[#003266] px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Submit Poster
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor Canvas Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center" ref={containerRef}>
              {saveMsg && (
                <div className={`w-full max-w-[960px] mb-3 px-4 py-2 rounded-xl text-xs font-bold ${
                  saveMsg.includes('failed') ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}>
                  {saveMsg}
                </div>
              )}

              {!isSubmitted && (
                <p className="text-[10px] text-slate-400 mb-4 max-w-[960px] text-center leading-relaxed">
                  💡 **Direct Edit Mode:** Click on any highlighted section on the poster template (Title, Members, Introduction, Conclusion, etc.) and type directly. Use the upload zones to insert your project diagrams. Sponsored branding remains locked.
                </p>
              )}

              {/* Scaled Presentation View */}
              <div
                style={{
                  width: '960px',
                  height: '1200px',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  marginBottom: `calc((1200px * ${1 - scale}) * -1)`,
                }}
                className="shrink-0 relative"
              >
                <CanonicalPoster
                  content={buildContent()}
                  isEditable={!isSubmitted}
                  onFieldChange={(key, val) => setFields((prev) => ({ ...prev, [key]: val }))}
                  onImageUpload={handleImageUpload}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Event Pass Placeholder Card ──────────────────────────────────────────────

const EventPassPlaceholderCard: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
      <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Ticket className="w-4 h-4 text-[#004182]" />
        Event Pass
      </h2>
      <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-3 shadow-xs">
          <Ticket className="w-6 h-6" />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2">
          Coming Soon
        </p>
        <p className="text-xs font-bold text-slate-700">Digital Pass & Stall Details</p>
        <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          Your official event pass with entry credentials, unique QR code, and stall allocation will become available in a future phase of PRAGATHI 2K26.
        </p>
      </div>
    </div>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export const ParticipantDashboard: React.FC = () => {
  const { session, profile, profileLoading, signOut } = useParticipantAuth();
  const navigate = useNavigate();
  const [registrationInternalId, setRegistrationInternalId] = useState<string | null>(null);

  // Resolve internal UUID from public registration ID for poster linkage
  useEffect(() => {
    if (!session?.registrationId) return;
    PosterService.resolveInternalId(session.registrationId).then((id) => {
      if (id) setRegistrationInternalId(id);
    });
  }, [session?.registrationId]);

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  // Format date
  const formattedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Top Nav Bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs shadow-slate-900/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">

          {/* Logo + title */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group focus:outline-none" aria-label="Back to PRAGATHI 2K26">
            <img src={sruLogo} alt="SR University Logo" className="h-7 sm:h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform duration-200" />
            <div className="hidden sm:block leading-none">
              <p className="text-xs font-extrabold text-[#004182] uppercase tracking-tight">PRAGATHI 2K26</p>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5">Participant Portal</p>
            </div>
          </Link>

          {/* Session info + logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session && (
              <div className="hidden sm:block text-right">
                <p className="text-xs font-mono font-bold text-[#004182] tracking-wider">{session.registrationId}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{session.leaderEmail}</p>
              </div>
            )}
            <button
              id="participant-logout-btn"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-xl transition-all duration-150 whitespace-nowrap"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-[#004182] to-[#003366] rounded-3xl p-5 sm:p-7 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white" />
          </div>
          <div className="relative z-10">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Welcome back</p>
            <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">
              {profileLoading
                ? 'Loading your profile…'
                : profile?.teamName
                ? profile.teamName
                : session?.registrationId}
            </h1>
            {profile?.projectTitle && (
              <p className="text-blue-100 text-sm mt-1.5 font-medium opacity-90 line-clamp-1">
                {profile.projectTitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
                <Hash className="w-3 h-3" />
                {session?.registrationId}
              </span>
              {profile && (
                <RegistrationStatusBadge status={profile.registrationStatus} />
              )}
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {profileLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading your registration details…</span>
          </div>
        )}

        {/* Profile Content */}
        {!profileLoading && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* LEFT — Team & Registration Info */}
            <div className="lg:col-span-2 space-y-5">

              {/* Registration Details Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[#004182]" />
                  Registration Details
                </h2>
                <dl className="space-y-3">
                  <div className="flex items-start gap-3">
                    <dt className="text-xs font-bold text-slate-400 w-28 shrink-0 mt-0.5">Reg. ID</dt>
                    <dd className="text-xs font-mono font-bold text-[#004182] tracking-wider">{profile.registrationId}</dd>
                  </div>
                  <div className="flex items-start gap-3">
                    <dt className="text-xs font-bold text-slate-400 w-28 shrink-0 mt-0.5">Team Name</dt>
                    <dd className="text-sm font-bold text-slate-800">{profile.teamName}</dd>
                  </div>
                  {profile.institutionName && (
                    <div className="flex items-start gap-3">
                      <dt className="text-xs font-bold text-slate-400 w-28 shrink-0 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Institution
                      </dt>
                      <dd className="text-xs font-semibold text-slate-700 leading-relaxed">{profile.institutionName}</dd>
                    </div>
                  )}
                  {profile.department && (
                    <div className="flex items-start gap-3">
                      <dt className="text-xs font-bold text-slate-400 w-28 shrink-0 mt-0.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Dept.
                      </dt>
                      <dd className="text-xs font-semibold text-slate-700">{profile.department}</dd>
                    </div>
                  )}
                  {formattedDate && (
                    <div className="flex items-start gap-3">
                      <dt className="text-xs font-bold text-slate-400 w-28 shrink-0 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Registered
                      </dt>
                      <dd className="text-xs font-semibold text-slate-700">{formattedDate}</dd>
                    </div>
                  )}
                  <div className="flex items-start gap-3 pt-1 border-t border-slate-100">
                    <dt className="text-xs font-bold text-slate-400 w-28 shrink-0 mt-0.5">Reg. Status</dt>
                    <dd><RegistrationStatusBadge status={profile.registrationStatus} /></dd>
                  </div>
                  <div className="flex items-start gap-3">
                    <dt className="text-xs font-bold text-slate-400 w-28 shrink-0 mt-0.5">Payment</dt>
                    <dd><PaymentStatusBadge status={profile.paymentStatus} /></dd>
                  </div>
                </dl>
              </div>

              {/* Project Card */}
              {(profile.projectTitle || profile.category) && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6">
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#004182]" />
                    Project Details
                  </h2>
                  <div className="space-y-3">
                    {profile.projectTitle && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">Project Title</p>
                        <p className="text-base font-bold text-slate-900 leading-snug">{profile.projectTitle}</p>
                      </div>
                    )}
                    {profile.category && (
                      <div className="flex items-center gap-2 pt-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-[#004182] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                          {profile.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Team Members */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#004182]" />
                  Team Members
                  <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    {profile.members.length} {profile.members.length === 1 ? 'Member' : 'Members'}
                  </span>
                </h2>
                <div className="space-y-2">
                  {profile.members.map((member, idx) => (
                    <MemberCard key={idx} member={member} index={idx} />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Coming Soon + Help */}
            <div className="space-y-5">

              {/* Event Details Quick Links */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                  Event Info
                </h2>
                <div className="space-y-2">
                  <Link
                    to="/"
                    className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 hover:text-[#004182] py-2 border-b border-slate-100 hover:border-blue-100 transition-colors group"
                  >
                    <span>PRAGATHI 2K26 Website</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <Link
                    to="/about"
                    className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 hover:text-[#004182] py-2 border-b border-slate-100 hover:border-blue-100 transition-colors group"
                  >
                    <span>About &amp; Rules</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 hover:text-[#004182] py-2 transition-colors group"
                  >
                    <span>Contact &amp; Helpline</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>

              {/* Poster + Coming Soon Features */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                  Your Poster
                </p>
                {/* Active Poster Card (Phase 3) */}
                {registrationInternalId ? (
                  <PosterCard
                    profile={profile}
                    registrationInternalId={registrationInternalId}
                  />
                ) : (
                  <ComingSoonCard
                    icon={<FileImage className="w-6 h-6" />}
                    title="Project Poster"
                    description="Submit your official standardized project poster for Expo Day."
                  />
                )}

                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mt-4">
                  Event Pass
                </p>
                <EventPassPlaceholderCard />
              </div>
            </div>
          </div>
        )}

        {/* Fallback: session exists but no profile (Supabase not configured) */}
        {!profileLoading && !profile && session && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-1">Profile Unavailable</h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                Your registration data could not be loaded right now. Please try again later or
                contact the event organisers.
              </p>
              <p className="text-xs font-mono font-bold text-[#004182] mt-3 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full inline-block">
                {session.registrationId}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-bold text-[#004182] border border-[#004182]/30 hover:bg-blue-50 px-5 py-2.5 rounded-xl transition-colors"
              >
                Retry
              </button>
              <Link
                to="/contact"
                className="text-sm font-bold text-slate-600 hover:text-[#004182] border border-slate-200 hover:border-blue-200 px-5 py-2.5 rounded-xl transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        )}

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 mt-10 py-6 px-4 text-center">
        <p className="text-xs text-slate-400">
          © 2026 PRAGATHI 2K26 · SR University, Warangal ·{' '}
          <Link to="/contact" className="hover:text-[#004182] font-medium transition-colors">
            Contact &amp; Helpline
          </Link>
        </p>
      </footer>
    </div>
  );
};
