import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';
import { useVerification } from '../hooks/useVerification';

interface SRUVerificationCardProps {
  onVerificationSuccess: (data: {
    fullName: string;
    email: string;
    rollNumber: string;
    department?: string;
  }) => void;
  initialEmail?: string;
  initialRollNumber?: string;
}

export const SRUVerificationCard: React.FC<SRUVerificationCardProps> = ({
  onVerificationSuccess,
  initialEmail = '',
  initialRollNumber = '',
}) => {
  const [email, setEmail] = useState<string>(initialEmail);
  const [rollNumber, setRollNumber] = useState<string>(initialRollNumber);
  const [fullName, setFullName] = useState<string>('');
  const [department, setDepartment] = useState<string>('School of Computer Science & Engineering');

  const { verifying, result, verifyStudent, resetVerification, isValidSRUEmail } = useVerification();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !rollNumber) return;

    const res = await verifyStudent({
      fullName: fullName || 'SRU Student',
      email,
      rollNumber,
      department,
      yearOfStudy: 'Undergraduate',
    });

    if (res.isVerified) {
      onVerificationSuccess({
        fullName: fullName || 'SRU Student',
        email,
        rollNumber,
        department,
      });
    }
  };

  const isEmailValidDomain = isValidSRUEmail(email);

  return (
    <div className="bg-white rounded-3xl border border-blue-200/90 shadow-lg p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all">
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            <GraduationCap className="w-3.5 h-3.5 text-[#004182]" />
            <span>SR University Student Verification</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-display">
            Verify SRU Student Identity
          </h3>
          <p className="text-xs text-slate-500">
            SR University students enjoy <strong>100% FREE Registration</strong> for PRAGATHI 2K26
          </p>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#004182] flex items-center justify-center font-bold shrink-0 border border-blue-100">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Verification State Machine Rendering */}
      <AnimatePresence mode="wait">
        
        {/* STATE 2: CHECKING / LOADING */}
        {verifying && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-12 text-center space-y-4"
          >
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-40" />
              <div className="w-14 h-14 bg-white rounded-full border-2 border-[#004182] shadow-md flex items-center justify-center relative z-10">
                <Loader2 className="w-7 h-7 text-[#004182] animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 font-display">
                Checking Credentials...
              </h4>
              <p className="text-xs text-slate-500">
                Verifying <code className="text-[#004182] font-mono font-bold">{email}</code> against SR University student database
              </p>
            </div>
          </motion.div>
        )}

        {/* STATE 3: VERIFIED (SUCCESS) */}
        {!verifying && result?.isVerified && (
          <motion.div
            key="verified"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Green Success Banner */}
            <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-950 font-display flex items-center gap-1.5">
                    ✓ SR University Student Verified
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Official SR University email <code className="font-mono font-bold">{email}</code> verified!
                  </p>
                </div>
              </div>

              {/* Fee Box */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Registration Fee</span>
                  <span className="text-lg font-extrabold text-emerald-700">₹0 (Waived)</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                  FREE REGISTRATION
                </span>
              </div>
            </div>

            {/* Prototype Disclaimer */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2 leading-relaxed">
              <Info className="w-4 h-4 text-[#004182] shrink-0 mt-0.5" />
              <span>
                <strong>Official Verification Notice:</strong> Prototype simulates verification against SR University student database. Final verification on Expo Day uses authorized SR University student data/API.
              </span>
            </div>

            {/* Next Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetVerification}
                className="w-full sm:w-auto text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Verify Another Roll Number</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onVerificationSuccess({
                    fullName: fullName || 'SRU Student',
                    email,
                    rollNumber,
                    department,
                  })
                }
                className="w-full sm:w-auto bg-[#004182] hover:bg-[#003366] text-white font-bold py-3 px-6 rounded-full text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>CONTINUE → Team Registration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STATE 4: VERIFICATION FAILED (ERROR) */}
        {!verifying && result && !result.isVerified && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3 text-rose-900">
                <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold font-display text-rose-950">
                    Unable to verify your university details.
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    {result.message}
                  </p>
                </div>
              </div>

              {/* Resolution Checklist */}
              <div className="bg-white p-4 rounded-xl border border-rose-200/80 text-xs text-slate-700 space-y-2">
                <span className="font-bold text-slate-900 block">Please verify the following:</span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  <li>
                    <strong>Check Email:</strong> Must be your official SR University email ending with <code className="bg-slate-100 text-slate-800 px-1 rounded font-bold font-mono">@sru.edu.in</code>
                  </li>
                  <li>
                    <strong>Check Roll Number:</strong> Enter your complete university roll/registration number (e.g. 23SRU1042)
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={resetVerification}
                className="bg-slate-900 hover:bg-[#004182] text-white font-bold py-2.5 px-6 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-200" />
                <span>Try Again</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STATE 1: IDLE / FORM ENTRY */}
        {!verifying && !result && (
          <motion.form
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleVerify}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  University Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="studentname@sru.edu.in"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden transition-all ${
                      email && !isEmailValidDomain
                        ? 'border-rose-300 bg-rose-50/30'
                        : email && isEmailValidDomain
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 focus:border-[#004182]'
                    }`}
                    required
                  />
                  {email && isEmailValidDomain && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must end with <code className="font-bold text-slate-600">@sru.edu.in</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Roll / Registration Number *
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 23SRU1042"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182] uppercase"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Official SRU Student Roll Number
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School / Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#004182]" />
                <span>Registration Fee: <strong>₹0 (FREE)</strong></span>
              </div>

              <button
                type="submit"
                disabled={!email || !rollNumber}
                className="bg-[#004182] hover:bg-[#003366] text-white font-bold py-3 px-8 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-40"
              >
                <ShieldCheck className="w-4 h-4 text-blue-200" />
                <span>VERIFY STUDENT</span>
              </button>
            </div>
          </motion.form>
        )}

      </AnimatePresence>
    </div>
  );
};
