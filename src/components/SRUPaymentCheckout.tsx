import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  Lock,
  Receipt,
  Server,
  AlertTriangle,
  Info,
  ChevronRight,
  Download,
  ArrowLeft,
} from 'lucide-react';
import {
  SRUPaymentService,
  PaymentState,
  PaymentInitiateRequest,
  PaymentVerifyResponse,
} from '../services/paymentService';

interface SRUPaymentCheckoutProps {
  registrationRecord: {
    id: string;
    teamName: string;
    institutionName: string;
    department?: string;
    members: any[];
    category: string;
    projectTitle: string;
    registrationType: string;
  };
  onPaymentSuccess: (receipt: PaymentVerifyResponse) => void;
  onBackToForm?: () => void;
}

export const SRUPaymentCheckout: React.FC<SRUPaymentCheckoutProps> = ({
  registrationRecord,
  onPaymentSuccess,
  onBackToForm,
}) => {
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentVerifyResponse | null>(null);
  const [simulateFail, setSimulateFail] = useState<boolean>(false);

  const leader = registrationRecord.members[0] || {
    name: 'Lead Participant',
    email: 'participant@example.com',
    phone: '9876543210',
  };

  const calculatedAmount = SRUPaymentService.calculateFee(
    registrationRecord.members.length,
    registrationRecord.registrationType === 'SRU_STUDENT'
  );

  const handlePayNow = async () => {
    setErrorMessage('');
    setPaymentState('creating');

    try {
      const initReq: PaymentInitiateRequest = {
        registrationId: registrationRecord.id,
        teamName: registrationRecord.teamName,
        leaderName: leader.name,
        leaderEmail: leader.email,
        leaderPhone: leader.phone,
        amountINR: calculatedAmount,
        institutionName: registrationRecord.institutionName,
        memberCount: registrationRecord.members.length,
      };

      // Call payment service abstraction (Edge function -> SR University Payment API)
      const initRes = await SRUPaymentService.createPaymentSession(initReq);

      setTransactionRef(initRes.transactionRef);

      // Transition to redirecting
      setPaymentState('redirecting');
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Transition to processing
      setPaymentState('processing');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verify payment status
      const verifyRes = await SRUPaymentService.verifyPaymentStatus(
        initRes.transactionRef,
        simulateFail
      );

      if (verifyRes.success) {
        setPaymentReceipt(verifyRes);
        setPaymentState('success');
        onPaymentSuccess(verifyRes);
      } else {
        setErrorMessage(verifyRes.message || 'Payment processing was declined by SR University Payment Gateway.');
        setPaymentState('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment session creation failed. Please try again.');
      setPaymentState('failed');
    }
  };

  const handleResetAndRetry = () => {
    setPaymentState('idle');
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-w-3xl mx-auto">
      
      {/* HEADER BANNER */}
      <div className="bg-[#004182] text-white p-6 sm:p-8 space-y-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-100 border border-white/20">
            <Building2 className="w-3.5 h-3.5 text-blue-200" />
            <span>SR UNIVERSITY OFFICIAL MERCHANT GATEWAY</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-blue-200 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
          External Participant Registration Payment
        </h2>
        <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
          PRAGATHI 2K26 National Level Project Expo • SR University, Warangal
        </p>
      </div>

      {/* DEV / SANDBOX ENVIRONMENT ADAPTER NOTICE */}
      <div className="bg-amber-50 border-b border-amber-200 p-3 px-6 text-xs text-amber-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="font-semibold">
            <span className="font-bold uppercase tracking-wider bg-amber-200 px-1.5 py-0.5 rounded text-[10px] mr-1">
              DEVELOPMENT ADAPTER
            </span>
            Connected to SR University Edge Gateway Sandbox. Official API credentials (<code className="bg-white px-1 rounded border border-amber-300 font-mono text-[10px]">PAYMENT_API_KEY</code>) will be injected server-side by Management.
          </p>
        </div>

        {paymentState === 'idle' && (
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold shrink-0 text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
            <input
              type="checkbox"
              checked={simulateFail}
              onChange={(e) => setSimulateFail(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span>Test Fail Flow</span>
          </label>
        )}
      </div>

      {/* MAIN CHECKOUT BODY */}
      <div className="p-6 sm:p-10 space-y-6">
        
        <AnimatePresence mode="wait">
          
          {/* STATE 1: IDLE / REGISTRATION SUMMARY & PAY NOW */}
          {paymentState === 'idle' && (
            <motion.div
              key="idleState"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="border border-slate-200 rounded-2xl bg-slate-50/70 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#004182]">
                    Registration Summary
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    Ref ID: {registrationRecord.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Team Name</span>
                    <span className="font-bold text-slate-900">{registrationRecord.teamName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Institution</span>
                    <span className="font-bold text-slate-900 truncate block">{registrationRecord.institutionName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Project Title</span>
                    <span className="font-bold text-slate-900 line-clamp-1">{registrationRecord.projectTitle}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">Team Size</span>
                    <span className="font-bold text-slate-900">{registrationRecord.members.length} Registered Members</span>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">TOTAL REGISTRATION FEE</span>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      PRAGATHI 2K26<br />
                      External Participant Registration<br />
                      Fee: ₹1,000 per Team
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#004182] font-display">
                      ₹{calculatedAmount.toLocaleString()} <span className="text-xs font-medium text-slate-500">INR</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                {onBackToForm ? (
                  <button
                    type="button"
                    onClick={onBackToForm}
                    className="w-full sm:w-auto text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 py-2.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Registration</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={handlePayNow}
                  className="w-full sm:w-auto bg-[#004182] hover:bg-[#003366] text-white font-extrabold text-sm px-10 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 text-blue-200" />
                  <span>PAY NOW — ₹{calculatedAmount.toLocaleString()} INR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 2 & 3 & 4: CREATING / REDIRECTING / PROCESSING */}
          {(paymentState === 'creating' || paymentState === 'redirecting' || paymentState === 'processing') && (
            <motion.div
              key="processingState"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-12 text-center space-y-6"
            >
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-[#004182] animate-spin" />
                <Building2 className="w-8 h-8 text-[#004182]" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-slate-900">
                  {paymentState === 'creating' && 'Initializing SR University Gateway...'}
                  {paymentState === 'redirecting' && 'Connecting to SR University Payment Server...'}
                  {paymentState === 'processing' && 'Verifying Transaction with Bank Server...'}
                </h3>
                <p className="text-xs text-slate-500">
                  {transactionRef ? `Transaction Ref: ${transactionRef}` : 'Securing transaction payload...'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Please do not refresh or close this browser window.
                </p>
              </div>
            </motion.div>
          )}

          {/* STATE 5: SUCCESS */}
          {paymentState === 'success' && paymentReceipt && (
            <motion.div
              key="successState"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    PAYMENT SUCCESSFUL
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 font-display pt-2">
                    Payment Verified by SR University
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your external registration fee has been received. Your team registration for PRAGATHI 2K26 is officially confirmed.
                  </p>
                </div>

                <div className="bg-white border border-emerald-200 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-bold">Transaction Reference</span>
                    <span className="font-mono font-bold text-slate-900">{paymentReceipt.transactionRef}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-bold">Paid Amount</span>
                    <span className="font-bold text-emerald-700">₹{calculatedAmount.toLocaleString()} INR</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-bold">Auth Authorization Code</span>
                    <span className="font-mono text-slate-700">{paymentReceipt.bankAuthorizationCode || 'SRU-AUTH-982103'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Timestamp</span>
                    <span className="text-slate-600">{new Date(paymentReceipt.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Official Registration Ticket Generated</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 6: FAILED */}
          {paymentState === 'failed' && (
            <motion.div
              key="failedState"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30">
                  <XCircle className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-widest bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
                    PAYMENT FAILED
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 font-display pt-2">
                    Transaction Could Not Be Processed
                  </h3>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    {errorMessage || 'The payment request was declined by the bank authorization server.'}
                  </p>
                </div>

                {transactionRef && (
                  <div className="text-xs font-mono text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-rose-200 inline-block">
                    Attempted Ref: {transactionRef}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                {onBackToForm && (
                  <button
                    type="button"
                    onClick={onBackToForm}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3 rounded-full text-xs"
                  >
                    Edit Registration Details
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetAndRetry}
                  className="w-full sm:w-auto bg-[#004182] hover:bg-[#003366] text-white font-bold px-8 py-3 rounded-full text-xs sm:text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>TRY AGAIN</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
};
