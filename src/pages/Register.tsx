import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building,
  ChevronRight,
  Check,
  Mail,
  User,
  Phone,
  School,
  Info,
  Printer,
} from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { useHomePath } from '../context/HomePathContext';
import { PROJECT_CATEGORIES } from '../data/eventData';
import { SRUPaymentService } from '../services/paymentService';
import { RegistrationService, TeamMember } from '../services/registrationService';
import { RegistrationReviewConfirmation } from '../components/RegistrationReviewConfirmation';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { eventSettings } = useContent();
  const { getHomePath } = useHomePath();

  // Step flow:
  // 1: Primary Email Entry
  // 2: Team & Institution Info
  // 3: Project Title & Abstract
  // 4: Review & Final Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Email state for initial entry
  const [primaryEmail, setPrimaryEmail] = useState<string>('');

  // Internal classification derived from email ending (@sru.edu.in vs external)
  const isSRUEmail = primaryEmail.trim().toLowerCase().endsWith('@sru.edu.in');
  const regMode: 'SRU_STUDENT' | 'EXTERNAL' = isSRUEmail ? 'SRU_STUDENT' : 'EXTERNAL';

  // Form Fields
  const [teamName, setTeamName] = useState<string>('');
  const [category, setCategory] = useState<string>(PROJECT_CATEGORIES[0].id);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [projectAbstract, setProjectAbstract] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  // Team Members (1 to 5 members)
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: '', email: '', phone: '', role: 'Leader', rollNumber: '' },
  ]);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedRecord, setConfirmedRecord] = useState<any>(null);
  const [formError, setFormError] = useState<string>('');

  // Automatically update institution name when switching email domain type if default SRU
  useEffect(() => {
    if (isSRUEmail) {
      if (!institutionName || institutionName === '') {
        setInstitutionName('SR University, Warangal');
      }
    }
  }, [isSRUEmail]);

  // Member Management Functions
  const handleAddMember = () => {
    if (members.length >= 5) return;
    setMembers([
      ...members,
      {
        id: String(Date.now()),
        name: '',
        email: '',
        phone: '',
        role: 'Member',
        rollNumber: '',
      },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleMemberChange = (id: string, field: keyof TeamMember, value: string) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setMembers(members.map((m) => (m.id === id ? { ...m, [field]: finalValue } : m)));
    if (id === members[0].id && field === 'email') {
      setPrimaryEmail(value);
    }
  };

  // Step 1 Validation -> Step 2
  const handleProceedStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const emailTrimmed = primaryEmail.trim();
    if (!emailTrimmed) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setFormError('Please enter a valid email address format (e.g. name@domain.com).');
      return;
    }

    if (emailTrimmed.toLowerCase().endsWith('@sru.edu.in')) {
      setFormError('Registration for SR University students is currently closed.');
      return;
    }

    // Keep Team Leader email in sync
    const updatedMembers = [...members];
    updatedMembers[0].email = emailTrimmed;
    setMembers(updatedMembers);

    if (emailTrimmed.toLowerCase().endsWith('@sru.edu.in') && !institutionName) {
      setInstitutionName('SR University, Warangal');
    }

    setCurrentStep(2);
  };

  // Step 2 Validation -> Step 3
  const handleProceedStep2 = () => {
    setFormError('');

    if (!members[0].name.trim()) {
      setFormError('Please enter Team Leader name.');
      return;
    }

    if (!members[0].email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(members[0].email.trim())) {
      setFormError('Please enter a valid Team Leader email address.');
      return;
    }

    const leaderPhone = members[0].phone.trim();
    if (!leaderPhone || leaderPhone.length !== 10 || !/^\d{10}$/.test(leaderPhone)) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!teamName.trim()) {
      setFormError('Please enter a team name.');
      return;
    }

    if (!institutionName.trim()) {
      setFormError('Please enter your Institution or School / College name.');
      return;
    }

    // Validate all team members (Team Leader & additional members)
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const mName = member.name.trim();
      const mEmail = member.email.trim().toLowerCase();
      const mPhone = member.phone.trim();

      if (mEmail.endsWith('@sru.edu.in')) {
        setFormError('Registration for SR University students is currently closed.');
        return;
      }

      if (i > 0 && (mName || mEmail || mPhone)) {
        if (!mName) {
          setFormError(`Please enter Name for Member ${i + 1}.`);
          return;
        }
        if (!mEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mEmail)) {
          setFormError(`Please enter a valid Email for Member ${i + 1}.`);
          return;
        }
        if (!mPhone || mPhone.length !== 10 || !/^\d{10}$/.test(mPhone)) {
          setFormError('Please enter a valid 10-digit phone number.');
          return;
        }
      }
    }

    setCurrentStep(3);
  };

  // Step 3 Validation -> Step 4
  const handleProceedStep3 = () => {
    setFormError('');
    if (!projectTitle.trim() || projectTitle.length < 5) {
      setFormError('Please enter a descriptive project title (at least 5 characters).');
      return;
    }
    if (!projectAbstract.trim() || projectAbstract.length < 20) {
      setFormError('Please enter a brief project abstract (at least 20 characters).');
      return;
    }
    setCurrentStep(4);
  };

  return (
    <div className="registration-page-container py-8 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 bg-white">
      
      {/* Top Navigation & Header */}
      <div className="space-y-4">
        <div className="no-print">
          <Link
            to={getHomePath()}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#004182] hover:text-blue-900 transition-colors bg-blue-50/80 px-3.5 py-1.5 rounded-full border border-blue-100 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-[#004182] border border-blue-100 px-3.5 py-1 rounded-full text-xs font-bold">
            <GraduationCap className="w-4 h-4 text-[#004182]" />
            <span>{eventSettings.institution}, {eventSettings.location}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#004182] font-display uppercase tracking-tight">
            PRAGATHI 2K26 REGISTRATION
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            A National Level Project Expo • {eventSettings.eventDate}
          </p>
        </div>
      </div>

      {/* Confirmation State Pass Screen */}
      {confirmedRecord ? (
        <div
          id="registration-confirmation-print-area"
          className="registration-confirmation-print-area bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-10 space-y-6 text-center animate-in fade-in duration-300"
        >
          {/* Print-only Event Header Branding */}
          <div className="hidden print:block text-center space-y-1 pb-4 border-b border-slate-200 mb-2">
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#004182]">
              {eventSettings.institution} • {eventSettings.location}
            </div>
            <h1 className="text-2xl font-black text-[#004182] font-display uppercase tracking-tight">
              {eventSettings.eventName} — REGISTRATION CONFIRMATION
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              National Level Project Expo • {eventSettings.eventDate}
            </p>
          </div>

          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Registration Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Registration Confirmed!
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your team is registered for <strong>{eventSettings.eventName}</strong> at {eventSettings.institution}, {eventSettings.location}.
            </p>
          </div>

          {/* Important Notice Box */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-left max-w-lg mx-auto shadow-xs flex items-start gap-3">
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

          {/* Registration Pass Ticket Box */}
          <div
            id="registration-pass-ticket"
            className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4 max-w-lg mx-auto text-xs sm:text-sm shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Registration ID</span>
                <div className="text-base font-mono font-bold text-[#004182]">
                  {confirmedRecord.registrationId}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Expo Date</span>
                <div className="font-bold text-slate-900">{eventSettings.eventDate}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Name</span>
                <div className="font-semibold text-slate-900">{confirmedRecord.teamName}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Institution</span>
                <div className="font-semibold text-slate-900 truncate">{confirmedRecord.institutionName}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Project Title</span>
                <div className="font-semibold text-slate-900 truncate">{confirmedRecord.projectTitle}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Size</span>
                <div className="font-semibold text-slate-900">{confirmedRecord.members?.length || 1} Members</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
              <span>Venue: {eventSettings.venue}</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Status: Active
              </span>
            </div>
          </div>

          {/* Action Buttons: Print / Download + Go to Home */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 no-print">
            <button
              id="printbtn"
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#004182] hover:bg-[#003366] text-white font-bold px-7 py-3.5 rounded-full text-sm shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Confirmation</span>
            </button>

            <button
              id="5m2e7p"
              type="button"
              onClick={() => navigate(getHomePath())}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-7 py-3.5 rounded-full text-sm border border-slate-200 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <span>Go to Home Page</span>
            </button>
          </div>
        </div>
      ) : (
        /* Multi-step Registration Flow Container */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-0">
          
          {/* Progress Indicator */}
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-4 sm:p-6">
            <div className="max-w-2xl mx-auto grid grid-cols-4 gap-2 text-center text-xs font-bold">
              
              <div className={`py-2 px-1 sm:px-3 rounded-full border transition-all flex items-center justify-center gap-1.5 ${
                currentStep === 1
                  ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                  : currentStep > 1
                  ? 'bg-blue-50 text-[#004182] border-blue-200'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}>
                {currentStep > 1 ? <Check className="w-3.5 h-3.5 text-[#004182]" /> : <span>1.</span>}
                <span className="truncate">Email</span>
              </div>

              <div className={`py-2 px-1 sm:px-3 rounded-full border transition-all flex items-center justify-center gap-1.5 ${
                currentStep === 2
                  ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                  : currentStep > 2
                  ? 'bg-blue-50 text-[#004182] border-blue-200'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}>
                {currentStep > 2 ? <Check className="w-3.5 h-3.5 text-[#004182]" /> : <span>2.</span>}
                <span className="truncate">Team</span>
              </div>

              <div className={`py-2 px-1 sm:px-3 rounded-full border transition-all flex items-center justify-center gap-1.5 ${
                currentStep === 3
                  ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                  : currentStep > 3
                  ? 'bg-blue-50 text-[#004182] border-blue-200'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}>
                {currentStep > 3 ? <Check className="w-3.5 h-3.5 text-[#004182]" /> : <span>3.</span>}
                <span className="truncate">Abstract</span>
              </div>

              <div className={`py-2 px-1 sm:px-3 rounded-full border transition-all flex items-center justify-center gap-1.5 ${
                currentStep === 4
                  ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                  : 'bg-white text-slate-400 border-slate-200'
              }`}>
                <span>4.</span>
                <span className="truncate">Confirm</span>
              </div>

            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            
            {/* Form Error Alert */}
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: EMAIL ADDRESS ENTRY */}
            {currentStep === 1 && (
              <form onSubmit={handleProceedStep1} className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-300">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004182] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <Sparkles className="w-3.5 h-3.5 text-[#004182]" />
                    <span>Common Registration</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#004182] font-display uppercase">
                    Enter Email Address
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Provide your primary contact email address to begin team registration for PRAGATHI 2K26.
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-200/90 shadow-xs space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={primaryEmail}
                        onChange={(e) => setPrimaryEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm sm:text-base font-medium focus:outline-hidden focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-normal">
                      Enter your personal or institutional email address.
                    </p>
                  </div>

                  {isSRUEmail ? (
                    <div className="bg-amber-50/90 border-2 border-amber-200/90 rounded-2xl p-5 sm:p-6 space-y-3 text-left shadow-xs animate-in fade-in duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-amber-950 font-display">
                            🎓 SR University Student Registration Currently Closed
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed pt-2 border-t border-amber-200/80">
                        <p className="font-semibold text-slate-900">
                          Registration for SR University students is currently closed.
                        </p>
                        <p>
                          Further information regarding SR University student registration will be announced by the organizing committee at a later date. Please check the official PRAGATHI 2.0 website and follow our social media channels for the latest updates.
                        </p>
                        <p className="font-medium text-amber-900">
                          Thank you for your interest in PRAGATHI 2.0.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full bg-[#004182] hover:bg-[#003366] text-white font-bold py-3.5 px-6 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Continue to Registration Form</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* STEP 2: TEAM & INSTITUTION DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-[#004182] font-display uppercase">
                    Team & Institution Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    Please enter the full names of all participants carefully, as they will be printed on the certificates.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Leader Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={members[0]?.name || ''}
                        onChange={(e) => handleMemberChange(members[0].id, 'name', e.target.value)}
                        placeholder="Full Name"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Leader Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={members[0]?.email || primaryEmail}
                        onChange={(e) => handleMemberChange(members[0].id, 'email', e.target.value)}
                        placeholder="Email Address"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Leader Phone *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        value={members[0]?.phone || ''}
                        onChange={(e) => handleMemberChange(members[0].id, 'phone', e.target.value)}
                        placeholder="Phone Number"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Innovators 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School / College / University Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <School className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="e.g. Kakatiya Public School / NIT Warangal"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department (Optional)
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science / Robotics"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Innovation Track Domain *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182] bg-white"
                  >
                    {PROJECT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Members List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Team Members (1 to 5 Members)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={members.length >= 5}
                      className="text-xs font-bold text-[#004182] hover:text-blue-900 flex items-center gap-1 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Member ({members.length}/5)
                    </button>
                  </div>

                  {members.map((m, idx) => (
                    <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#004182] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {idx === 0 ? 'Team Leader' : `Member ${idx + 1}`}
                        </span>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          placeholder="Full Name *"
                          value={m.name}
                          onChange={(e) => handleMemberChange(m.id, 'name', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                        <input
                          type="email"
                          placeholder="Email Address *"
                          value={m.email}
                          onChange={(e) => handleMemberChange(m.id, 'email', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                        <input
                          type="tel"
                          maxLength={10}
                          pattern="[0-9]{10}"
                          placeholder="Phone Number *"
                          value={m.phone}
                          onChange={(e) => handleMemberChange(m.id, 'phone', e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Step 2 Navigation Buttons */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedStep2}
                    className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-7 py-2.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all"
                  >
                    <span>Next: Project Abstract</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: PROJECT ABSTRACT */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-[#004182] font-display uppercase">
                    Project Details & Abstract
                  </h2>
                  <p className="text-xs text-slate-500">
                    Provide information about your prototype or innovation for evaluation
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Autonomous Solar Agriculture Monitoring Bot"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Abstract / Summary (20–1000 characters) *
                  </label>
                  <textarea
                    rows={5}
                    value={projectAbstract}
                    onChange={(e) => setProjectAbstract(e.target.value)}
                    placeholder="Describe the problem statement, proposed solution, technology stack, hardware components, and novelty of your project..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedStep3}
                    className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-7 py-2.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2"
                  >
                    <span>Review & Confirm</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRMATION */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <RegistrationReviewConfirmation
                  data={{
                    participantType: regMode,
                    leaderName: members[0]?.name || 'Lead Participant',
                    leaderEmail: members[0]?.email || primaryEmail || '',
                    leaderPhone: members[0]?.phone || '',
                    institutionName: institutionName || 'Institution',
                    department: department,
                    teamName: teamName,
                    teamSize: members.length,
                    teamMembers: members.map((m) => ({
                      name: m.name,
                      email: m.email,
                      phone: m.phone,
                      role: m.role,
                    })),
                    projectTitle: projectTitle,
                    category: PROJECT_CATEGORIES.find((c) => c.id === category)?.title || category,
                    paymentStatus: regMode === 'SRU_STUDENT' ? 'FREE' : 'PAID',
                    paidAmount: regMode === 'SRU_STUDENT' ? 0 : SRUPaymentService.EXTERNAL_TEAM_REGISTRATION_FEE,
                  }}
                  onEditParticipant={() => setCurrentStep(1)}
                  onEditTeam={() => setCurrentStep(2)}
                  onEditProject={() => setCurrentStep(3)}
                  onEditPayment={() => setCurrentStep(2)}
                  onSubmitRegistration={async (paymentDetails) => {
                    let transactionRef = '';

                    if (regMode === 'EXTERNAL') {
                      if (!paymentDetails?.transactionId || !paymentDetails?.proofFile) {
                        return {
                          success: false,
                          registrationId: '',
                          message: 'Transaction ID and payment proof screenshot are required for external registration.',
                        };
                      }
                      transactionRef = paymentDetails.transactionId;
                    }

                    // 1. Submit registration record to DB
                    const submissionRes = await RegistrationService.submitRegistration({
                      teamName,
                      category: PROJECT_CATEGORIES.find((c) => c.id === category)?.title || category,
                      projectTitle,
                      projectAbstract,
                      registrationType: regMode,
                      institutionName: institutionName,
                      department,
                      members,
                      paymentStatus: regMode === 'SRU_STUDENT' ? 'FREE_SRU' : 'PENDING',
                      transactionRef: regMode === 'EXTERNAL' ? transactionRef : undefined,
                    });

                    if (!submissionRes.success || !submissionRes.record) {
                      return {
                        success: false,
                        registrationId: '',
                        message: submissionRes.message || 'Failed to complete registration submission.',
                      };
                    }

                    // 2. For external participants, upload payment proof associated with the created registration ID
                    if (regMode === 'EXTERNAL' && paymentDetails?.proofFile) {
                      const regCode = submissionRes.record.registrationId || submissionRes.record.id;
                      try {
                        const uploadRes = await SRUPaymentService.uploadPaymentProof(
                          regCode,
                          paymentDetails.proofFile,
                          transactionRef
                        );

                        if (!uploadRes.success) {
                          console.warn('Payment proof upload warning:', uploadRes.message);
                        }
                      } catch (uploadErr: any) {
                        console.warn('Payment proof upload error:', uploadErr?.message || uploadErr);
                      }
                    }

                    if (regMode === 'SRU_STUDENT') {
                      setConfirmedRecord(submissionRes.record);
                    }

                    return {
                      success: true,
                      registrationId: submissionRes.registrationId || submissionRes.record.registrationId,
                    };
                  }}
                  onGoHome={() => navigate(getHomePath())}
                />
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
