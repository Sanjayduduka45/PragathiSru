import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Send,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { OpportunityEnquiryService } from '../services/opportunityEnquiryService';

export interface OpportunityEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  message: string;
}

const INITIAL_FORM: FormData = {
  fullName: '',
  email: '',
  phone: '',
  organization: '',
  designation: '',
  message: '',
};

export const OpportunityEnquiryModal: React.FC<OpportunityEnquiryModalProps> = ({
  isOpen,
  onClose,
  opportunity,
}) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Track previous isOpen state to only reset when modal is freshly opened
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      // Modal just opened
      setFormData(INITIAL_FORM);
      setErrors({});
      setIsSuccess(false);
      setServerError(null);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, opportunity]);

  // Handle body overflow & escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const cleanPhone = formData.phone.replace(/[\s\-()+]/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await OpportunityEnquiryService.submitEnquiry({
        opportunityName: opportunity,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        organization: formData.organization,
        designation: formData.designation,
        message: formData.message,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setServerError(res.message || 'Failed to submit enquiry. Please try again.');
      }
    } catch (err) {
      setServerError('An unexpected network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 340 }}
            className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] mx-auto"
          >
            {/* Header */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-slate-50/60 shrink-0 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  <Sparkles className="w-3 h-3 text-[#004182]" />
                  <span>Opportunity Enquiry</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display leading-snug">
                  {opportunity}
                </h3>
                {!isSuccess && (
                  <p className="text-xs text-slate-500">
                    Tell us a little about yourself and our organizing team will get in touch.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {isSuccess ? (
                <div className="text-center py-6 sm:py-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 max-w-sm mx-auto">
                    <h4 className="text-lg font-bold text-slate-900 font-display">
                      Enquiry Submitted Successfully
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Thank you for your interest in PRAGATHI 2K26. Our organizing team will get in touch with you soon.
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-8 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {serverError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#004182]" />
                      <span>Full Name *</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Dr. Ramesh Kumar / Priya Sharma"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-hidden transition-colors ${
                        errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#004182]'
                      }`}
                      required
                    />
                    {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
                  </div>

                  {/* Email & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#004182]" />
                        <span>Email Address *</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@company.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-hidden transition-colors ${
                          errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#004182]'
                        }`}
                        required
                      />
                      {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#004182]" />
                        <span>Phone Number *</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-hidden transition-colors ${
                          errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#004182]'
                        }`}
                        required
                      />
                      {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Organization & Designation Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Organization / College</span>
                        <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="e.g. TechCorp / ABC College"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-[#004182]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>Designation / Role</span>
                        <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. HR Manager / Principal"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-[#004182]"
                      />
                    </div>
                  </div>

                  {/* Message / Interest */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>Message / Specific Interest</span>
                      <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share details on how you would like to participate or collaborate..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-[#004182] resize-none"
                    />
                  </div>

                  {/* Form Footer */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Enquiry</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
