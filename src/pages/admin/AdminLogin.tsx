import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminLogin: React.FC = () => {
  const { signIn, isSupabaseReady } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-[#004182] text-white flex items-center justify-center font-bold font-display text-xl shadow-md">
              SR
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
            <h1 className="text-xl font-bold text-slate-900">Admin Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">
              Management access only. Authorized personnel only.
            </p>
          </div>
        </div>

        {/* Supabase warning */}
        {!isSupabaseReady && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Database Not Connected</p>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                Supabase credentials are not configured. Login requires a connected Supabase project.
                Add <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">.env</code> file.
              </p>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-800 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sru.edu.in"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#004182] hover:bg-[#003366] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p className="text-center text-xs text-slate-400">
          <Link to="/" className="hover:text-[#004182] font-semibold transition-colors">
            ← Back to PRAGATHI 2K26 Website
          </Link>
        </p>
      </div>
    </div>
  );
};
