import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Edit3,
  Users,
  Building2,
  FolderCode,
  CreditCard,
  UserCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Home,
  FileText,
  ShieldCheck,
  Check,
  AlertCircle,
  Eye,
  X,
  Info,
} from 'lucide-react';

export interface ReviewTeamMember {
  name: string;
  email: string;
  phone?: string;
  role: string;
  rollNumber?: string;
  classOrYear?: string;
}

export interface RegistrationReviewData {
  participantType: 'SRU_STUDENT' | 'EXTERNAL';
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  institutionName: string;
  department?: string;
  teamName: string;
  teamSize: number;
  teamMembers: ReviewTeamMember[];
  projectTitle: string;
  category: string;
  paymentStatus: 'FREE' | 'PAID' | 'PENDING';
  paidAmount?: number;
  transactionRef?: string;
}

interface RegistrationReviewConfirmationProps {
  data: RegistrationReviewData;
  onEditParticipant: () => void;
  onEditTeam: () => void;
  onEditProject: () => void;
  onEditPayment: () => void;
  onSubmitRegistration: () => Promise<{ success: boolean; registrationId: string; message?: string }>;
  onGoHome: () => void;
}

export const RegistrationReviewConfirmation: React.FC<RegistrationReviewConfirmationProps> = ({
  data,
  onEditParticipant,
  onEditTeam,
  onEditProject,
  onEditPayment,
  onSubmitRegistration,
  onGoHome,
}) => {
  const [confirmedCorrect, setConfirmedCorrect] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedCorrect || isSubmitting) return;

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const res = await onSubmitRegistration();
      if (res.success) {
        setConfirmedId(res.registrationId);
      } else {
        setSubmitError(res.message || 'Registration submission failed. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during registration submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS STATE VIEW
  if (confirmedId) {
    return (
      <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-10 space-y-8 text-center max-w-2xl mx-auto relative overflow-hidden animate-in fade-in duration-300">
        
        {/* Subtle Celebratory Background Particles */}
        <div className="absolute inset-0 pointer-events-none opacity-30 motion-reduce:hidden">
          <div className="absolute top-6 left-10 w-2 h-2 rounded-full bg-emerald-400 animate-ping duration-1000" />
          <div className="absolute top-12 right-12 w-3 h-3 rounded-full bg-blue-400 animate-pulse duration-700" />
          <div className="absolute bottom-16 left-16 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping duration-1000" />
          <div className="absolute bottom-8 right-20 w-2 h-2 rounded-full bg-emerald-500 animate-pulse duration-500" />
        </div>

        {/* Animated Checkmark Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 250 }}
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
        </motion.div>

        {/* Headline */}
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>🎉 Registration Successful</span>
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            PRAGATHI 2K26 Registration Confirmed
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your team registration has been successfully recorded.
          </p>
        </div>

        {/* Important Notice Box */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-left max-w-lg mx-auto shadow-xs flex items-start gap-3 relative z-10">
          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 space-y-1">
            <div className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] sm:text-[11px]">
              Important — Save Your ID
            </div>
            <p className="leading-relaxed">
              Keep your Registration ID safe. You’ll need it along with your registered email to sign in and access your Participant Profile.
            </p>
          </div>
        </div>

        {/* Confirmation Ticket Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4 max-w-lg mx-auto text-xs sm:text-sm shadow-xs relative z-10">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider block">
                Registration ID
              </span>
              <span className="text-lg font-mono font-extrabold text-[#004182]">
                {confirmedId}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider block">
                Status
              </span>
              <span className="inline-block font-extrabold px-2.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                Confirmed
              </span>
            </div>
          </div>

          <div className="space-y-2 text-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Team Name</span>
              <span className="font-bold text-slate-900 text-base">{data.teamName}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Project Title</span>
              <span className="font-semibold text-slate-900 line-clamp-2">{data.projectTitle}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Institution</span>
              <span className="font-semibold text-slate-900">{data.institutionName}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Expo Date: 09 October 2026</span>
            <span>SR University, Warangal</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto bg-[#004182] hover:bg-[#003366] text-white font-extrabold px-8 py-3.5 rounded-full text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-blue-200" />
            <span>GO TO HOME</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDetailModal(true)}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-8 py-3.5 rounded-full text-xs sm:text-sm border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>VIEW REGISTRATION</span>
          </button>
        </div>

        {/* Registration Details Modal */}
        <AnimatePresence>
          {showDetailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 text-left shadow-2xl relative border border-slate-200"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#004182]" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base font-display">
                      Registration Details
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Registration ID</span>
                      <strong className="text-[#004182] font-mono">{confirmedId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Institution</span>
                      <strong className="truncate block">{data.institutionName}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Lead Contact</span>
                    <strong>{data.leaderName}</strong> ({data.leaderEmail} • {data.leaderPhone})
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Members ({data.teamMembers.length})</span>
                    <ul className="mt-1 space-y-1">
                      {data.teamMembers.map((m, idx) => (
                        <li key={idx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span><strong>{m.name}</strong> ({m.role})</span>
                          <span className="text-[10px] text-slate-500">{m.email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Project Title & Category</span>
                    <p className="font-bold text-slate-900">{data.projectTitle}</p>
                    <span className="text-[10px] bg-blue-50 text-[#004182] px-2 py-0.5 rounded font-medium">
                      {data.category}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Status</span>
                    <span className="font-extrabold text-emerald-700">
                      Confirmed
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2 rounded-full text-xs"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  // REVIEW & CONFIRMATION FORM VIEW
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-3xl mx-auto space-y-0">
      
      {/* HEADER BANNER */}
      <div className="bg-[#004182] text-white p-6 sm:p-8 space-y-1">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-100 border border-white/20">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
          <span>FINAL REGISTRATION REVIEW</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          Review & Confirm Registration
        </h2>
        <p className="text-xs text-blue-100">
          Verify all provided details carefully before finalizing your submission for PRAGATHI 2K26.
        </p>
      </div>

      {/* REVIEW CARDS CONTAINER */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {submitError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-semibold">{submitError}</p>
          </div>
        )}

        {/* 1. LEAD CONTACT INFO */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#004182]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#004182]">
                Lead Contact Info
              </span>
            </div>
            <button
              type="button"
              onClick={onEditParticipant}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#004182] hover:text-[#002855] bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>EDIT CONTACT</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Lead Contact Name</span>
              <strong className="text-slate-900">{data.leaderName}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Email</span>
              <span className="text-slate-800">{data.leaderEmail}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Phone</span>
              <span className="text-slate-800">{data.leaderPhone || 'Not provided'}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Institution</span>
              <strong className="text-slate-900">{data.institutionName}</strong>
            </div>
          </div>
        </div>

        {/* 2. INSTITUTION & TEAM */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#004182]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#004182]">
                Institution & Team
              </span>
            </div>
            <button
              type="button"
              onClick={onEditTeam}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#004182] hover:text-[#002855] bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>EDIT TEAM</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pb-2 border-b border-slate-200/80">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Institution</span>
              <strong className="text-slate-900">{data.institutionName}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Name</span>
              <strong className="text-slate-900 font-bold text-sm">{data.teamName}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Size</span>
              <span className="text-slate-800">{data.teamSize} Member(s)</span>
            </div>

            {data.department && (
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Department</span>
                <span className="text-slate-800 truncate block">{data.department}</span>
              </div>
            )}
          </div>

          {/* Member Roster */}
          <div className="space-y-1.5 pt-1">
            <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Team Members</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {data.teamMembers.map((m, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="text-[10px] text-slate-500 block">{m.email}</span>
                  </div>
                  <span className="text-[10px] font-extrabold bg-blue-50 text-[#004182] px-2 py-0.5 rounded border border-blue-100">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. PROJECT TITLE & CATEGORY */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <FolderCode className="w-4 h-4 text-[#004182]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#004182]">
                Project Title & Innovation Track
              </span>
            </div>
            <button
              type="button"
              onClick={onEditProject}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#004182] hover:text-[#002855] bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>EDIT PROJECT</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Project Title</span>
              <strong className="text-slate-900 text-sm font-bold block">{data.projectTitle}</strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Innovation Track Category</span>
              <span className="inline-block bg-blue-50 text-[#004182] font-bold px-3 py-1 rounded-full border border-blue-200 mt-1">
                {data.category}
              </span>
            </div>
          </div>
        </div>

        {/* 4. PAYMENT STATUS (ONLY FOR EXTERNAL PARTICIPANTS) */}
        {data.participantType === 'EXTERNAL' && (
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#004182]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#004182]">
                  Payment Details
                </span>
              </div>
              <button
                type="button"
                onClick={onEditPayment}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#004182] hover:text-[#002855] bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>EDIT DETAILS</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Registration Fee</span>
                <span className="font-extrabold text-slate-900 text-base">
                  ₹1,000 per Team
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Flat fee for team of 1–5 members
                </span>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 font-extrabold text-xs px-3 py-1 rounded-full border bg-blue-50 text-[#004182] border-blue-200">
                  <CreditCard className="w-3.5 h-3.5 text-[#004182]" />
                  <span>Gateway Payment</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION FORM */}
        <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-200 space-y-6">
          
          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 bg-blue-50/80 border border-blue-200 p-4 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
            <input
              type="checkbox"
              checked={confirmedCorrect}
              onChange={(e) => setConfirmedCorrect(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#004182] focus:ring-[#004182] cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-800 font-semibold leading-snug">
              I confirm that the information provided is correct.
            </span>
          </label>

          {/* SUBMIT BUTTON & LOADING STATE */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={!confirmedCorrect || isSubmitting}
              className="w-full sm:w-auto bg-[#004182] hover:bg-[#003366] text-white font-extrabold text-sm sm:text-base px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>SUBMITTING REGISTRATION...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-blue-200" />
                  <span>
                    {data.participantType === 'EXTERNAL' ? 'PROCEED TO PAYMENT (₹1,000)' : 'SUBMIT REGISTRATION'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
