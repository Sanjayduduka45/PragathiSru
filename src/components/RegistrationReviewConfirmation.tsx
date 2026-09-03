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
  QrCode,
  Upload,
  Clock,
  FileCheck,
  Printer,
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
  onSubmitRegistration: (paymentDetails?: { transactionId: string; proofFile: File }) => Promise<{ success: boolean; registrationId: string; message?: string }>;
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

  // Manual payment fields for External Participants
  const [transactionId, setTransactionId] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileError, setProofFileError] = useState<string>('');
  const [isPendingVerification, setIsPendingVerification] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofFileError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp', 'pdf'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExtensions.includes(ext)) {
        setProofFileError('Invalid file format. Please upload PNG, JPG, JPEG, WEBP, or PDF.');
        setProofFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setProofFileError('File size exceeds 5MB limit. Please upload a smaller file.');
        setProofFile(null);
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (data.participantType === 'EXTERNAL') {
      if (!transactionId.trim()) {
        setSubmitError('Please enter a valid Transaction ID / UTR Number.');
        return;
      }
      if (!proofFile) {
        setSubmitError('Please upload your payment screenshot / receipt proof.');
        return;
      }
    }

    if (!confirmedCorrect || isSubmitting) return;

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const paymentDetails = data.participantType === 'EXTERNAL' && proofFile
        ? { transactionId: transactionId.trim(), proofFile }
        : undefined;

      const res = await onSubmitRegistration(paymentDetails);
      if (res.success) {
        setConfirmedId(res.registrationId);
        if (data.participantType === 'EXTERNAL') {
          setIsPendingVerification(true);
        }
      } else {
        setSubmitError(res.message || 'Registration submission failed. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during registration submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PENDING PAYMENT VERIFICATION VIEW (FOR EXTERNAL PARTICIPANTS)
  if (confirmedId && isPendingVerification) {
    return (
      <div
        id="registration-confirmation-print-area"
        className="registration-confirmation-print-area bg-white rounded-3xl border border-amber-200 shadow-xl p-6 sm:p-10 space-y-6 sm:space-y-8 text-center max-w-2xl mx-auto relative overflow-hidden animate-in fade-in duration-300"
      >
        
        {/* Animated Warning / Pending Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 250 }}
          >
            <Clock className="w-12 h-12" />
          </motion.div>
        </motion.div>

        {/* Headline */}
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Registration Submitted — Payment Verification Pending</span>
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
            PENDING PAYMENT VERIFICATION
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
            Your registration has been submitted and your payment is pending verification. You will receive a confirmation email after the payment is approved.
          </p>
        </div>

        {/* Info Card */}
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
                Payment Status
              </span>
              <span className="inline-block font-extrabold px-2.5 py-0.5 rounded text-xs bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                PENDING
              </span>
            </div>
          </div>

          <div className="space-y-2 text-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Team Name</span>
              <span className="font-bold text-slate-900 text-base">{data.teamName}</span>
            </div>

            {transactionId && (
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800">{transactionId}</span>
              </div>
            )}

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

        {/* Non-Refundable Payment Notice */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 text-left max-w-lg mx-auto shadow-xs flex items-start gap-3 relative z-10">
          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            <strong className="font-extrabold text-amber-900 tracking-wide mr-1 uppercase text-[10px] sm:text-[11px]">
              IMPORTANT:
            </strong>
            <span>
              Registration fee is <strong className="font-bold text-slate-900">non-refundable</strong>. Once the payment is made, it will not be refunded under any circumstances.
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#004182] border border-[#004182] font-extrabold px-8 py-3.5 rounded-full text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#004182]" />
            <span>PRINT</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto bg-[#004182] hover:bg-[#003366] text-white font-extrabold px-8 py-3.5 rounded-full text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-blue-200" />
            <span>GO TO HOME</span>
          </button>
        </div>

      </div>
    );
  }

  // SUCCESS STATE VIEW (FOR SRU STUDENTS / IMMEDIATE APPROVAL)
  if (confirmedId) {
    return (
      <div
        id="registration-confirmation-print-area"
        className="registration-confirmation-print-area bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-10 space-y-6 sm:space-y-8 text-center max-w-2xl mx-auto relative overflow-hidden animate-in fade-in duration-300"
      >
        
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#004182] border border-[#004182] font-extrabold px-8 py-3.5 rounded-full text-xs sm:text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#004182]" />
            <span>PRINT</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto bg-[#004182] hover:bg-[#003366] text-white font-extrabold px-8 py-3.5 rounded-full text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-blue-200" />
            <span>GO TO HOME</span>
          </button>
        </div>

      </div>
    );
  }

  // REVIEW & CONFIRMATION FORM VIEW
  const isSubmitDisabled = data.participantType === 'EXTERNAL'
    ? (!confirmedCorrect || !transactionId.trim() || !proofFile || isSubmitting)
    : (!confirmedCorrect || isSubmitting);

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

        {/* 4. PAYMENT DETAILS & QR CODE (ONLY FOR EXTERNAL PARTICIPANTS) */}
        {data.participantType === 'EXTERNAL' ? (
          <div className="border-2 border-blue-200 rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-blue-50/40 to-white space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#004182]" />
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#004182]">
                  Complete Payment (Manual Verification)
                </span>
              </div>
              <span className="text-xs font-extrabold bg-blue-100 text-[#004182] px-3 py-1 rounded-full border border-blue-200">
                ₹1,000 / Team
              </span>
            </div>

            {/* QR Code & Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Image Box */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Scan Official College Payment QR
                </div>
                <div className="w-48 h-48 mx-auto border-2 border-blue-100 rounded-xl overflow-hidden shadow-xs bg-slate-50 flex items-center justify-center">
                  <img
                    src="/payment_qr.jpeg"
                    alt="Official College Payment QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] font-semibold text-slate-500">
                  Scan the QR code below and pay ₹1,000 per team.
                </p>
              </div>

              {/* Instructions Box */}
              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 space-y-2">
                  <div className="font-extrabold text-[#004182] text-xs uppercase tracking-wider">
                    Payment Instructions
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 font-medium">
                    <li>Scan the QR code using GPay, PhonePe, Paytm, BHIM or any UPI app.</li>
                    <li>Pay flat fee of <strong>₹1,000 per team</strong>.</li>
                    <li>Note down the <strong>Transaction ID / UTR Number</strong>.</li>
                    <li>Upload payment screenshot/receipt below.</li>
                  </ol>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span className="font-medium">
                    After completing the payment, enter your Transaction ID and upload the payment screenshot.
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Payment Input Form */}
            <div className="space-y-4 pt-4 border-t border-blue-100">
              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Transaction ID / UTR Number *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 423984729834 or UTR123456789"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-hidden focus:border-[#004182] focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  required
                />
              </div>

              {/* Payment Proof File */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Upload Payment Screenshot / Receipt *
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-[#004182] bg-white rounded-2xl p-4 text-center transition-colors">
                  <input
                    type="file"
                    id="payment-proof-upload"
                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="payment-proof-upload" className="cursor-pointer space-y-2 block">
                    <Upload className="w-8 h-8 text-[#004182] mx-auto" />
                    {proofFile ? (
                      <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-[#004182]">Click to upload payment screenshot</span>
                        <span className="text-[11px] text-slate-500 block">Accepted formats: PNG, JPG, JPEG, WEBP, PDF (Max 5MB)</span>
                      </div>
                    )}
                  </label>
                </div>
                {proofFileError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{proofFileError}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SRU Student Free Registration Banner */
          <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>SR University Student Registration</span>
              </div>
              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                ₹0 — FREE
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Registration fee is waived for verified SR University students.
            </p>
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
              disabled={isSubmitDisabled}
              className="w-full sm:w-auto bg-[#004182] hover:bg-[#003366] text-white font-extrabold text-sm sm:text-base px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {data.participantType === 'EXTERNAL' ? 'SUBMITTING PAYMENT FOR VERIFICATION...' : 'SUBMITTING REGISTRATION...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {data.participantType === 'EXTERNAL' ? 'SUBMIT PAYMENT FOR VERIFICATION' : 'SUBMIT REGISTRATION'}
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
