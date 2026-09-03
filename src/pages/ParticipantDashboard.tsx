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
  QrCode,
  Eye,
} from 'lucide-react';
import { useParticipantAuth } from '../context/ParticipantAuthContext';
import type { ParticipantMember, ParticipantProfile } from '../context/ParticipantAuthContext';
import { PosterService } from '../services/posterService';
import type { PosterContent, PosterStatus, PosterSubmission } from '../services/posterService';
import { EventPassModal } from '../components/EventPassModal';

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

// ─── Poster Upload Card ─────────────────────────────────────────────────────────

const PosterCard: React.FC<{
  profile: ParticipantProfile;
  registrationInternalId: string;
  isLeader: boolean;
  currentUserEmail: string;
}> = ({
  profile,
  registrationInternalId,
  isLeader,
  currentUserEmail,
}) => {
  const [posterRecord, setPosterRecord] = useState<PosterSubmission | null>(null);
  const [posterLoading, setPosterLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing poster record on mount
  const loadPoster = useCallback(async () => {
    if (!registrationInternalId) return;
    try {
      const existing = await PosterService.getMyPoster(registrationInternalId);
      setPosterRecord(existing);
    } catch (err) {
      console.warn('Failed to load poster:', err);
    } finally {
      setPosterLoading(false);
    }
  }, [registrationInternalId]);

  useEffect(() => {
    loadPoster();
  }, [loadPoster]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again if needed
    e.target.value = '';

    // 1. Validation: Leader check
    if (!isLeader) {
      setUploadError('Unauthorized: Only the designated Team Leader can upload or replace the project poster.');
      return;
    }

    // 2. Validation: File Type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setUploadError('Unsupported file format. Please upload a PDF, PNG, or JPG/JPEG poster.');
      return;
    }

    // 3. Validation: File Size (max 20MB)
    const MAX_SIZE_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('Poster file is too large. Maximum allowed file size is 20MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    const meta = {
      registrationId: profile.registrationId,
      teamName: profile.teamName,
      projectTitle: profile.projectTitle || 'Project Prototype',
      category: profile.category,
      institutionName: profile.institutionName || 'SR University',
      leaderName: profile.leaderName,
      leaderEmail: profile.leaderEmail,
    };

    const res = await PosterService.uploadPosterFile(
      registrationInternalId,
      file,
      meta,
      currentUserEmail
    );

    setUploading(false);

    if (res.success) {
      setUploadSuccessMsg('Poster uploaded successfully!');
      setTimeout(() => setUploadSuccessMsg(null), 5000);
      await loadPoster();
    } else {
      setUploadError(res.error || 'Poster upload failed. Please try again.');
    }
  };

  if (posterLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-medium">Checking poster status…</span>
      </div>
    );
  }

  const isSubmitted = posterRecord?.status === 'submitted';
  const fileUrl = posterRecord?.posterContent?.fileUrl;
  const fileName = posterRecord?.posterContent?.fileName;
  const isPdf =
    posterRecord?.posterContent?.fileType === 'application/pdf' ||
    fileName?.toLowerCase().endsWith('.pdf') ||
    fileUrl?.toLowerCase().includes('.pdf');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      {/* Hidden native file picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        className="hidden"
        aria-label="Upload Project Poster"
      />

      {/* Card Header & Content */}
      <div className="p-4 sm:p-5 space-y-3.5">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isSubmitted
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                : 'bg-blue-50 border border-blue-200 text-[#004182]'
            }`}
          >
            <FileImage className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-900">Project Poster</h3>
              {isSubmitted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Submitted
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {isSubmitted
                ? 'Poster uploaded successfully for PRAGATHI 2K26.'
                : isLeader
                ? 'Upload your official project poster (PDF, PNG, or JPG/JPEG up to 20MB).'
                : `Poster submission is managed by your Team Leader (${profile.leaderName || 'Team Leader'}).`}
            </p>
          </div>
        </div>

        {/* Upload Status / Filename Info */}
        {isSubmitted && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                File
              </span>
              {posterRecord?.submittedAt && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(posterRecord.submittedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
            <p className="font-semibold text-slate-800 truncate">
              {fileName || 'Project_Poster.pdf'}
            </p>
          </div>
        )}

        {/* Success Alert */}
        {uploadSuccessMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {uploadError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{uploadError}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-1 flex flex-col gap-2">
          {uploading ? (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-white bg-[#004182]/80 px-4 py-2.5 rounded-xl cursor-not-allowed shadow-xs"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>UPLOADING POSTER...</span>
            </button>
          ) : isSubmitted ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  if (fileUrl) {
                    setViewerOpen(true);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-bold text-[#004182] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>VIEW POSTER</span>
              </button>

              {isLeader && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
              )}
            </div>
          ) : isLeader ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-extrabold text-white bg-[#004182] hover:bg-[#003366] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>UPLOAD YOUR POSTER</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Poster upload is managed exclusively by your Team Leader.</span>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Poster Viewer Modal */}
      {viewerOpen && fileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileImage className="w-5 h-5 text-[#004182] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {fileName || 'Project Poster'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {profile.registrationId} • {profile.teamName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={fileUrl}
                  download={fileName || `PRAGATHI26-POSTER-${profile.registrationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#004182] hover:bg-[#003366] px-3.5 py-2 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setViewerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close Viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF or Image */}
            <div className="p-4 overflow-y-auto bg-slate-100 flex items-center justify-center min-h-[400px]">
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  title="Project Poster Preview"
                  className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={fileUrl}
                  alt={fileName || 'Project Poster'}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Event Pass Card ──────────────────────────────────────────────────────────

const EventPassCard: React.FC<{
  profile: ParticipantProfile;
  onOpenPassModal: () => void;
}> = ({ profile, onOpenPassModal }) => {
  const isApproved =
    profile.registrationStatus?.toLowerCase() === 'approved' ||
    profile.paymentStatus?.toLowerCase() === 'paid' ||
    profile.paymentStatus?.toLowerCase() === 'completed' ||
    profile.paymentStatus?.toLowerCase() === 'not_required' ||
    profile.paymentStatus?.toLowerCase() === 'free_sru' ||
    profile.paymentStatus?.toLowerCase() === 'free';

  const isRejected = profile.registrationStatus?.toLowerCase() === 'rejected';

  if (!isApproved) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#004182]" />
            Event Pass
          </h2>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isRejected ? 'Unavailable' : 'Pending Approval'}
          </span>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-2xs">
            <Ticket className="w-6 h-6" />
          </div>
          <p className="text-xs font-extrabold text-slate-800 mb-1">
            {isRejected
              ? 'Registration Rejected'
              : 'Digital Event Pass'}
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
            {isRejected
              ? 'Your registration was not approved, so an event pass is not available.'
              : 'Your official digital event pass will be available immediately after your registration and payment are approved by the organizers.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-blue-200 shadow-xs p-5 relative overflow-hidden transition-all hover:shadow-md">
      {/* Top Gold Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#004182] via-amber-400 to-[#004182]" />

      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[#004182]" />
          Event Pass
        </h2>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Ready
        </span>
      </div>

      <div className="bg-gradient-to-br from-blue-50/80 to-slate-50 border border-blue-100 rounded-2xl p-4 sm:p-5 text-left space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Registration Pass
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-[#004182]">
              {profile.registrationId}
            </span>
          </div>
          <div className="p-2 bg-white border border-blue-200/80 rounded-xl shadow-2xs shrink-0">
            <QrCode className="w-6 h-6 text-[#004182]" />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <p className="font-bold text-slate-800 line-clamp-1">{profile.teamName}</p>
          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{profile.projectTitle || profile.category}</p>
        </div>

        <div className="pt-2 border-t border-blue-200/60 flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenPassModal}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#004182] hover:bg-[#003366] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>VIEW YOUR PASS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export const ParticipantDashboard: React.FC = () => {
  const { session, profile, profileLoading, signOut } = useParticipantAuth();
  const navigate = useNavigate();
  const [registrationInternalId, setRegistrationInternalId] = useState<string | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState<boolean>(false);

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse" aria-busy="true" aria-label="Loading registration details">
            {/* LEFT Column Skeletons */}
            <div className="lg:col-span-2 space-y-5">
              {/* Registration Details Skeleton */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-200 rounded shrink-0" />
                  <div className="h-4 w-44 bg-slate-200 rounded-md" />
                </div>
                <div className="space-y-3.5 pt-1">
                  {[
                    { labelW: 'w-24', valW: 'w-36' },
                    { labelW: 'w-28', valW: 'w-48' },
                    { labelW: 'w-24', valW: 'w-56' },
                    { labelW: 'w-20', valW: 'w-40' },
                    { labelW: 'w-24', valW: 'w-28' },
                    { labelW: 'w-20', valW: 'w-24' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-3.5 ${row.labelW} bg-slate-100 rounded`} />
                      <div className={`h-3.5 ${row.valW} bg-slate-200 rounded`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Details Skeleton */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-200 rounded shrink-0" />
                  <div className="h-4 w-36 bg-slate-200 rounded-md" />
                </div>
                <div className="space-y-2 pt-1">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="h-5 w-4/5 bg-slate-200 rounded-md" />
                  <div className="h-6 w-32 bg-slate-100 rounded-full mt-2" />
                </div>
              </div>

              {/* Team Members Skeleton */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-200 rounded shrink-0" />
                    <div className="h-4 w-32 bg-slate-200 rounded-md" />
                  </div>
                  <div className="h-5 w-20 bg-slate-100 rounded-full" />
                </div>
                <div className="space-y-2.5">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-40 bg-slate-200 rounded" />
                        <div className="h-3 w-52 bg-slate-100 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT Column Skeletons */}
            <div className="space-y-5">
              {/* Event Info Skeleton */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="space-y-2 pt-1">
                  <div className="h-9 bg-slate-100 rounded-xl" />
                  <div className="h-9 bg-slate-100 rounded-xl" />
                  <div className="h-9 bg-slate-100 rounded-xl" />
                </div>
              </div>

              {/* Poster & Pass Skeletons */}
              <div className="space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded px-1" />
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-20 bg-slate-50 rounded-2xl border border-slate-100" />
                  <div className="h-9 bg-slate-200 rounded-xl" />
                </div>

                <div className="h-3 w-24 bg-slate-200 rounded px-1 mt-4" />
                <div className="bg-white rounded-3xl border border-blue-200 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-4 w-14 bg-emerald-100 rounded-full" />
                  </div>
                  <div className="h-20 bg-blue-50/60 rounded-2xl border border-blue-100" />
                  <div className="h-9 bg-[#004182]/20 rounded-xl" />
                </div>
              </div>
            </div>
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
                    isLeader={profile.isCurrentUserLeader}
                    currentUserEmail={profile.currentUserEmail || session?.userEmail || ''}
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
                <EventPassCard
                  profile={profile}
                  onOpenPassModal={() => setIsPassModalOpen(true)}
                />
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

        {/* Event Pass Modal */}
        {profile && (
          <EventPassModal
            isOpen={isPassModalOpen}
            onClose={() => setIsPassModalOpen(false)}
            profile={profile}
          />
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
