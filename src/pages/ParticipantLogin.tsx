import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hash, Mail, AlertCircle, Info } from 'lucide-react';
import { useParticipantAuth } from '../context/ParticipantAuthContext';

const pragathiLogo = '/image.png';

export const ParticipantLogin: React.FC = () => {
  const { signIn, session, loading } = useParticipantAuth();
  const navigate = useNavigate();

  const [registrationId, setRegistrationId] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && session) {
      navigate('/participant', { replace: true });
    }
  }, [session, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = registrationId.trim();
    const trimmedEmail = leaderEmail.trim();
    if (!trimmedId || !trimmedEmail) {
      setError('Please enter both your Registration ID and team leader email.');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error: authError } = await signIn(trimmedId, trimmedEmail);
    setSubmitting(false);
    if (authError) {
      setError(authError);
    } else {
      navigate('/participant', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-sm space-y-5">

        {/* Brand */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-3 group" aria-label="PRAGATHI 2K26 Home">
            <div className="w-12 h-12 rounded-2xl bg-[#004182] flex items-center justify-center shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform duration-200">
              <img src={pragathiLogo} alt="PRAGATHI Logo" className="h-9 w-auto object-contain" />
            </div>
            <div className="text-left">
              <p className="text-lg font-extrabold text-[#004182] uppercase tracking-tight leading-none">
                PRAGATHI 2K26
              </p>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-0.5">
                SR University, Warangal
              </p>
            </div>
          </Link>

          <div>
            <h1 className="text-xl font-bold text-slate-900">Participant Sign In</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enter your Registration ID and team leader email to access your profile.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm shadow-slate-900/5 p-6 sm:p-8 space-y-5">

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-800 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Registration ID */}
            <div>
              <label htmlFor="participant-reg-id" className="block text-xs font-bold text-slate-700 mb-1.5">
                Registration ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  id="participant-reg-id"
                  type="text"
                  required
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value.toUpperCase())}
                  placeholder="PRAGATHI26-XXXXXX"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-mono font-semibold tracking-widest focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
                />
              </div>
            </div>

            {/* Leader Email */}
            <div>
              <label htmlFor="participant-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Team Leader Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="participant-email"
                  type="email"
                  required
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  placeholder="teamleader@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="participant-login-btn"
              type="submit"
              disabled={submitting}
              className="w-full bg-[#004182] hover:bg-[#003366] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md shadow-blue-900/15 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign In to My Profile</span>
              )}
            </button>
          </form>
        </div>

        {/* Info note */}
        <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#004182] shrink-0 mt-0.5" />
          <p className="text-xs text-[#004182] leading-relaxed">
            <span className="font-bold">Where is my Registration ID?</span>
            <br />
            You'll find it in your registration confirmation — it looks like{' '}
            <span className="font-mono font-semibold">PRAGATHI26-ABC123</span>.
          </p>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-1.5 pb-4">
          <p className="text-xs text-slate-400">
            <Link to="/" className="hover:text-[#004182] font-semibold transition-colors">
              ← Back to PRAGATHI 2K26 Website
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            Are you an admin?{' '}
            <Link to="/admin/login" className="hover:text-[#004182] font-semibold transition-colors">
              Admin Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
