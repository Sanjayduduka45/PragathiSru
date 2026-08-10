import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Building,
  Users,
  Lightbulb,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  School,
  GraduationCap,
  Sparkles,
  MapPin,
  FileText,
  Target,
  Wrench,
  Rocket,
  Globe,
} from 'lucide-react';
import { PROJECT_CATEGORIES } from '../data/eventData';
import { TeamMember, RegistrationService } from '../services/registrationService';
import { SRUPaymentService } from '../services/paymentService';
import { SRUPaymentCheckout } from './SRUPaymentCheckout';

interface ExternalRegistrationFormProps {
  onSuccess: (record: any) => void;
  onCancel?: () => void;
}

export const ExternalRegistrationForm: React.FC<ExternalRegistrationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  // Active Progress Step:
  // 1: Participant (Leader)
  // 2: Institution
  // 3: Team
  // 4: Project
  // 5: Payment Summary
  const [step, setStep] = useState<number>(1);

  // STEP 1: PARTICIPANT (LEADER)
  const [leaderName, setLeaderName] = useState<string>('');
  const [leaderEmail, setLeaderEmail] = useState<string>('');
  const [leaderMobile, setLeaderMobile] = useState<string>('');
  const [leaderClassOrYear, setLeaderClassOrYear] = useState<string>('3rd Year B.Tech');
  const [leaderDepartment, setLeaderDepartment] = useState<string>('Computer Science & Engineering');

  // STEP 2: INSTITUTION
  const [institutionType, setInstitutionType] = useState<'School' | 'College / University'>('College / University');
  const [institutionName, setInstitutionName] = useState<string>('');
  const [city, setCity] = useState<string>('Warangal');
  const [state, setState] = useState<string>('Telangana');
  const [country, setCountry] = useState<string>('India');

  // STEP 3: TEAM
  const [teamName, setTeamName] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: '',
      email: '',
      phone: '',
      role: 'Leader',
      classOrYear: '3rd Year B.Tech',
      department: 'CSE',
    },
  ]);

  // STEP 4: PROJECT
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [category, setCategory] = useState<string>(PROJECT_CATEGORIES[0].id);
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [objective, setObjective] = useState<string>('');
  const [proposedSolution, setProposedSolution] = useState<string>('');
  const [innovation, setInnovation] = useState<string>('');
  const [applications, setApplications] = useState<string>('');
  const [expectedOutcomes, setExpectedOutcomes] = useState<string>('');

  // FORM VALIDATION & SUBMISSION
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdRegistrationRecord, setCreatedRegistrationRecord] = useState<any>(null);

  // Keep Leader in teamMembers synced
  const updateLeaderMember = (name: string, email: string, phone: string, classYear: string, dept: string) => {
    setTeamMembers((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[0] = {
          ...updated[0],
          name,
          email,
          phone,
          classOrYear: classYear,
          department: dept,
        };
      }
      return updated;
    });
  };

  // Team Member Dynamic Actions (1 to 5 members supported)
  const handleAddMember = () => {
    if (teamMembers.length >= 5) return;
    setTeamMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: '',
        email: '',
        phone: '',
        role: 'Member',
        classOrYear: leaderClassOrYear,
        department: leaderDepartment,
      },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (teamMembers.length <= 1) return;
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMemberChange = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // STEP VALIDATION HANDLERS
  const validateAndNextStep1 = () => {
    setErrorMsg('');
    if (!leaderName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!leaderEmail.trim() || !leaderEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!leaderMobile.trim() || leaderMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Sync leader info with Member 1
    updateLeaderMember(leaderName, leaderEmail, leaderMobile, leaderClassOrYear, leaderDepartment);
    setStep(2);
  };

  const validateAndNextStep2 = () => {
    setErrorMsg('');
    if (!institutionName.trim()) {
      setErrorMsg('Please enter your School or College / University name.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Please enter the institution city.');
      return;
    }
    if (!state.trim()) {
      setErrorMsg('Please enter the state.');
      return;
    }
    setStep(3);
  };

  const validateAndNextStep3 = () => {
    setErrorMsg('');
    if (!teamName.trim()) {
      setErrorMsg('Please enter a unique Team Name.');
      return;
    }

    // Validate members
    for (let i = 0; i < teamMembers.length; i++) {
      const m = teamMembers[i];
      if (!m.name.trim() || !m.email.trim() || !m.phone.trim()) {
        setErrorMsg(`Please fill in complete details for Team Member ${i + 1}.`);
        return;
      }
    }

    setStep(4);
  };

  const validateAndNextStep4 = () => {
    setErrorMsg('');
    if (!projectTitle.trim() || projectTitle.length < 5) {
      setErrorMsg('Please enter a descriptive Project Title (at least 5 characters).');
      return;
    }
    if (!problemStatement.trim() || problemStatement.length < 15) {
      setErrorMsg('Please describe the Problem Statement (at least 15 characters).');
      return;
    }
    if (!proposedSolution.trim() || proposedSolution.length < 15) {
      setErrorMsg('Please outline your Proposed Solution (at least 15 characters).');
      return;
    }
    setStep(5);
  };

  const handleFinalSubmission = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const projectAbstractSummary = `
Problem Statement: ${problemStatement}
Objective: ${objective}
Proposed Solution: ${proposedSolution}
Innovation: ${innovation}
Applications: ${applications}
Expected Outcomes: ${expectedOutcomes}
      `.trim();

      const res = await RegistrationService.submitRegistration({
        teamName,
        category,
        projectTitle,
        projectAbstract: projectAbstractSummary,
        registrationType: 'EXTERNAL',
        institutionName,
        institutionType,
        city,
        state,
        country,
        department: leaderDepartment,
        members: teamMembers,
        paymentStatus: 'PENDING',
        problemStatement,
        objective,
        proposedSolution,
        innovation,
        applications,
        expectedOutcomes,
      });

      if (res.success && res.record) {
        setCreatedRegistrationRecord(res.record);
        setStep(6);
      } else {
        setErrorMsg('Failed to complete registration draft saving. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedFee = SRUPaymentService.calculateFee(teamMembers.length);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
      
      {/* STEPS PROGRESS INDICATOR */}
      <div className="bg-slate-50/90 border-b border-slate-200 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto grid grid-cols-5 gap-1.5 sm:gap-3 text-center text-[10px] sm:text-xs font-bold">
          
          {/* STEP 1: PARTICIPANT */}
          <div
            className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 ${
              step === 1
                ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                : step > 1
                ? 'bg-blue-50 text-[#004182] border-blue-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {step > 1 ? <Check className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">1. Participant</span>
            <span className="sm:hidden">1. User</span>
          </div>

          {/* STEP 2: INSTITUTION */}
          <div
            className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 ${
              step === 2
                ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                : step > 2
                ? 'bg-blue-50 text-[#004182] border-blue-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {step > 2 ? <Check className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">2. Institution</span>
            <span className="sm:hidden">2. Inst.</span>
          </div>

          {/* STEP 3: TEAM */}
          <div
            className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 ${
              step === 3
                ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                : step > 3
                ? 'bg-blue-50 text-[#004182] border-blue-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {step > 3 ? <Check className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            <span>3. Team</span>
          </div>

          {/* STEP 4: PROJECT */}
          <div
            className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 ${
              step === 4
                ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                : step > 4
                ? 'bg-blue-50 text-[#004182] border-blue-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {step > 4 ? <Check className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
            <span>4. Project</span>
          </div>

          {/* STEP 5: PAYMENT */}
          <div
            className={`py-2 px-1 rounded-xl border transition-all flex items-center justify-center gap-1 ${
              step === 5
                ? 'bg-[#004182] text-white border-[#004182] shadow-xs'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>5. Payment</span>
          </div>

        </div>
      </div>

      {/* FORM BODY CONTAINER */}
      <div className="p-6 sm:p-10 space-y-6">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: PARTICIPANT (LEADER) DETAILS */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100">
                  <User className="w-3.5 h-3.5 text-[#004182]" />
                  <span>Step 1 of 5</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  Primary Participant / Team Leader Details
                </h3>
                <p className="text-xs text-slate-500">
                  Provide contact information for the lead registered participant
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    placeholder="e.g. Srikant Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={leaderEmail}
                    onChange={(e) => setLeaderEmail(e.target.value)}
                    placeholder="e.g. srikant@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={leaderMobile}
                    onChange={(e) => setLeaderMobile(e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Class / Year of Study *
                  </label>
                  <input
                    type="text"
                    value={leaderClassOrYear}
                    onChange={(e) => setLeaderClassOrYear(e.target.value)}
                    placeholder="e.g. Class 10 / 3rd Year B.Tech"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Stream
                  </label>
                  <input
                    type="text"
                    value={leaderDepartment}
                    onChange={(e) => setLeaderDepartment(e.target.value)}
                    placeholder="e.g. Science / Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs text-slate-500 font-bold hover:text-slate-800"
                  >
                    Cancel
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={validateAndNextStep1}
                  className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-7 py-2.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all"
                >
                  <span>Next: Institution Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: INSTITUTION DETAILS */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100">
                  <Building className="w-3.5 h-3.5 text-[#004182]" />
                  <span>Step 2 of 5</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  School / College Institution Details
                </h3>
                <p className="text-xs text-slate-500">
                  Specify your school or higher education institute location
                </p>
              </div>

              {/* Institution Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Institution Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setInstitutionType('School')}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      institutionType === 'School'
                        ? 'border-[#004182] bg-blue-50/80 text-[#004182] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      institutionType === 'School' ? 'bg-[#004182] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <School className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">School Participant</div>
                      <div className="text-[11px] text-slate-500">Classes 8 to 12</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInstitutionType('College / University')}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      institutionType === 'College / University'
                        ? 'border-[#004182] bg-blue-50/80 text-[#004182] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      institutionType === 'College / University' ? 'bg-[#004182] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">College / University</div>
                      <div className="text-[11px] text-slate-500">Diploma / UG / PG Students</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Hyderabad Public School / NIT Warangal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Warangal / Hyderabad"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Telangana"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={validateAndNextStep2}
                  className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-7 py-2.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all"
                >
                  <span>Next: Team Members</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TEAM MEMBERS */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100">
                  <Users className="w-3.5 h-3.5 text-[#004182]" />
                  <span>Step 3 of 5</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  Team Name & Members (1 to 5 Members)
                </h3>
                <p className="text-xs text-slate-500">
                  Dynamic team size: 1, 2, 3, 4, or 5 members allowed. Exactly 4 or 5 is NOT required.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Cyber Matrix / RoboInnovators"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                  required
                />
              </div>

              {/* Dynamic Member Cards */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Registered Team Members ({teamMembers.length} / 5)
                  </span>

                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={teamMembers.length >= 5}
                    className="text-xs font-bold text-[#004182] hover:text-blue-900 flex items-center gap-1 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    Add Member
                  </button>
                </div>

                {teamMembers.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-[#004182] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Name *</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={m.name}
                          onChange={(e) => handleMemberChange(m.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Email *</label>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={m.email}
                          onChange={(e) => handleMemberChange(m.id, 'email', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Mobile *</label>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={m.phone}
                          onChange={(e) => handleMemberChange(m.id, 'phone', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={validateAndNextStep3}
                  className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-7 py-2.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all"
                >
                  <span>Next: Project Abstract</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PROJECT DETAILS */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100">
                  <Lightbulb className="w-3.5 h-3.5 text-[#004182]" />
                  <span>Step 4 of 5</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  Project Prototype & Abstract Information
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed technical breakdown for evaluation panel screening
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Autonomous Solar Crop Health Bot"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Innovation Track Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#004182] bg-white"
                  >
                    {PROJECT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title} ({cat.badgeText})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed Breakdown Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#004182]" />
                    <span>Problem Statement *</span>
                  </label>
                  <textarea
                    rows={3}
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder="What specific issue or challenge does your project address?"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-[#004182]" />
                    <span>Objective</span>
                  </label>
                  <textarea
                    rows={3}
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="Primary goals and target benchmarks of your innovation..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-[#004182]" />
                    <span>Proposed Solution *</span>
                  </label>
                  <textarea
                    rows={3}
                    value={proposedSolution}
                    onChange={(e) => setProposedSolution(e.target.value)}
                    placeholder="Describe your technical hardware/software system architecture..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#004182]" />
                    <span>Innovation & Novelty</span>
                  </label>
                  <textarea
                    rows={3}
                    value={innovation}
                    onChange={(e) => setInnovation(e.target.value)}
                    placeholder="What makes your approach novel or better than existing solutions?"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#004182]" />
                    <span>Real-world Applications</span>
                  </label>
                  <input
                    type="text"
                    value={applications}
                    onChange={(e) => setApplications(e.target.value)}
                    placeholder="e.g. Smart farming, Precision agriculture, Industrial IoT"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Rocket className="w-3.5 h-3.5 text-[#004182]" />
                    <span>Expected Outcomes</span>
                  </label>
                  <input
                    type="text"
                    value={expectedOutcomes}
                    onChange={(e) => setExpectedOutcomes(e.target.value)}
                    placeholder="e.g. 40% reduction in water usage, automated disease detection"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004182]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={validateAndNextStep4}
                  className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-7 py-2.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all"
                >
                  <span>Next: Review & Payment Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: PAYMENT SUMMARY & REGISTRATION REVIEW */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#004182] bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100">
                  <CreditCard className="w-3.5 h-3.5 text-[#004182]" />
                  <span>Step 5 of 5</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  Registration Review & Payment Gateway Overview
                </h3>
                <p className="text-xs text-slate-500">
                  Review your complete team application details before proceeding to payment
                </p>
              </div>

              {/* Review Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 text-xs sm:text-sm">
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Name</span>
                    <span className="font-bold text-slate-900">{teamName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Institution</span>
                    <span className="font-bold text-slate-900 truncate block">{institutionName} ({institutionType})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Location</span>
                    <span className="font-bold text-slate-900">{city}, {state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Team Size</span>
                    <span className="font-bold text-slate-900">{teamMembers.length} Members</span>
                  </div>
                </div>

                <div className="space-y-2 border-b border-slate-200 pb-4">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Project Title & Category</span>
                  <div className="font-bold text-slate-900 text-sm">{projectTitle}</div>
                  <div className="text-xs text-[#004182] font-medium bg-blue-50/80 inline-block px-2.5 py-0.5 rounded-full border border-blue-100">
                    Category: {category}
                  </div>
                </div>

                {/* Registered Members List Summary */}
                <div className="space-y-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Registered Team Members</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {teamMembers.map((m, idx) => (
                      <div key={m.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{m.name} {idx === 0 ? '(Leader)' : ''}</div>
                          <div className="text-[10px] text-slate-500">{m.email} • {m.phone}</div>
                        </div>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
                          {m.classOrYear || 'Student'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Gateway Box */}
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-slate-500 text-xs font-bold block uppercase tracking-wider">CALCULATED ENTRY FEE</span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#004182]">₹{calculatedFee.toLocaleString()} INR</div>
                    <span className="text-xs text-slate-600 font-semibold block mt-1">Registration Fee: ₹1,000 / Team</span>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ready for Gateway</span>
                    </span>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-full text-xs flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Project</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmission}
                  disabled={isSubmitting}
                  className="bg-[#004182] hover:bg-[#003366] text-white font-bold px-8 py-3 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 text-blue-200" />
                  <span>{isSubmitting ? 'Saving Registration...' : 'PROCEED TO PAYMENT GATEWAY'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: SR UNIVERSITY PAYMENT GATEWAY CHECKOUT */}
          {step === 6 && createdRegistrationRecord && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <SRUPaymentCheckout
                registrationRecord={createdRegistrationRecord}
                onBackToForm={() => setStep(5)}
                onPaymentSuccess={(receipt) => {
                  const updatedRecord = {
                    ...createdRegistrationRecord,
                    paymentStatus: 'COMPLETED',
                    transactionRef: receipt.transactionRef,
                  };
                  onSuccess(updatedRecord);
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
};
