/**
 * Login.tsx - Common Role-Aware Login Page
 *
 * Single entry point at /login for all roles.
 * Fields: Email + Password (no role selector).
 *
 * Auth architecture:
 *   Step 1: Query registrations table by leader_email only.
 *           If email is found -> PARTICIPANT PATH only (never falls through to admin).
 *           If email is NOT found -> ADMIN PATH only (never uses participant credentials).
 *
 *   Role is always resolved from the DB/Supabase Auth result - never from client input,
 *   URL parameters, localStorage, sessionStorage, or user selection.
 *
 * Future roles (jury, coordinator):
 *   After Step 2 admin signIn succeeds, query a user_roles table and call
 *   getRedirectPath(resolvedRole). See FUTURE EXTENSION POINT comment below.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { useParticipantAuth } from '../context/ParticipantAuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const sruLogo = '/B4240911-4EF0-4DE3-8093-B50A0D0EA744_4_5005_c.jpeg';

// ---------------------------------------------------------------------------
// ROLE REDIRECT MAP
// Current active roles: participant, admin
// Future roles: extend here when jury/coordinator dashboards are ready.
// ---------------------------------------------------------------------------
type AppRole = 'participant' | 'admin' | 'jury' | 'coordinator';

function getRedirectPath(role: AppRole): string {
  switch (role) {
    case 'participant':
      return '/participant';
    case 'admin':
      return '/admin';
    case 'jury':
      // Not yet implemented - safe fallback until jury dashboard exists
      return '/coming-soon';
    case 'coordinator':
      // Not yet implemented - safe fallback until coordinator dashboard exists
      return '/coming-soon';
    default:
      return '/';
  }
}

// Generic error - never reveals which specific check (participant or admin) failed.
const GENERIC_ERROR = 'Invalid email or password. Please check your details and try again.';

export const Login: React.FC = () => {
  const {
    signIn: participantSignIn,
    session: participantSession,
    loading: participantLoading,
  } = useParticipantAuth();
  const { signIn: adminSignIn, user: adminUser, loading: adminLoading } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // -------------------------------------------------------------------------
  // Redirect immediately if already authenticated (either system)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (participantLoading || adminLoading) return;
    if (participantSession) {
      navigate(getRedirectPath('participant'), { replace: true });
      return;
    }
    if (adminUser) {
      navigate(getRedirectPath('admin'), { replace: true });
    }
  }, [participantSession, adminUser, participantLoading, adminLoading, navigate]);

  // -------------------------------------------------------------------------
  // Submit: email-based path separation
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter your email and password.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError('Service unavailable. Please contact the event organizers.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // -------------------------------------------------------------------
      // Determine auth path: look up email in registrations or team_members.
      // Role path is decided by DB result, never by client input.
      // -------------------------------------------------------------------
      const { data: regRows, error: regCheckError } = await supabase
        .from('registrations')
        .select('registration_id')
        .ilike('leader_email', trimmedEmail)   // case-insensitive email match
        .limit(1);

      if (regCheckError) {
        // DB lookup itself failed (network / RLS error)
        setError(GENERIC_ERROR);
        return;
      }

      let isParticipant = Boolean(regRows && regRows.length > 0);

      if (!isParticipant) {
        // Check if email belongs to a team member
        const { data: memberRows, error: memberCheckError } = await supabase
          .from('team_members')
          .select('id, registration_id')
          .ilike('email', trimmedEmail)
          .limit(1);

        if (!memberCheckError && memberRows && memberRows.length > 0) {
          isParticipant = true;
        }
      }

      if (isParticipant) {
        // =================================================================
        // PARTICIPANT PATH
        // Email exists in registrations table (leader) or team_members (member).
        // Password field = registration_id.
        // This path NEVER touches Supabase Auth / admin system.
        // =================================================================
        const { error: participantError } = await participantSignIn(
          trimmedPassword,  // registration_id used as password
          trimmedEmail      // participant email
        );

        if (!participantError) {
          navigate(getRedirectPath('participant'), { replace: true });
        } else {
          // Wrong password (registration_id didn't match) - show generic error.
          // Do NOT fall through to admin path.
          setError(GENERIC_ERROR);
        }
      } else {
        // =================================================================
        // ADMIN / FUTURE-ROLE PATH
        // Email NOT in registrations table. Try Supabase Auth.
        // Participant credentials NEVER reach this branch.
        //
        // FUTURE EXTENSION POINT:
        //   After adminSignIn succeeds, resolve the actual role:
        //   const { data: { user } } = await supabase.auth.getUser();
        //   const { data: roleRow } = await supabase
        //     .from('user_roles')
        //     .select('role')
        //     .eq('user_id', user.id)
        //     .single();
        //   navigate(getRedirectPath(roleRow.role as AppRole), { replace: true });
        // =================================================================
        const { error: adminError } = await adminSignIn(trimmedEmail, trimmedPassword);

        if (!adminError) {
          const resolvedRole: AppRole = 'admin';
          navigate(getRedirectPath(resolvedRole), { replace: true });
        } else {
          setError(GENERIC_ERROR);
        }
      }
    } catch {
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Loading spinner - wait for both auth contexts to initialise
  // -------------------------------------------------------------------------
  if (participantLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-sm space-y-5">

        {/* Brand */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block group" aria-label="PRAGATHI 2K26 Home">
            <img
              src={sruLogo}
              alt="SR University Logo"
              className="h-10 sm:h-12 w-auto mx-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sign In</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              PRAGATHI 2K26 &mdash; Enter your email and password to continue.
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="........"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full bg-[#004182] hover:bg-[#003366] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md shadow-blue-900/15 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        {/* Participant hint */}
        <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#004182] shrink-0 mt-0.5" />
          <p className="text-xs text-[#004182] leading-relaxed">
            <span className="font-bold">Participants:</span> Use your registered email and your{' '}
            <span className="font-mono font-semibold">PRAGATHI26-XXXXXX</span> Registration ID as the password.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-slate-400">
            <Link to="/" className="hover:text-[#004182] font-semibold transition-colors">
              Back to PRAGATHI 2K26 Website
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
