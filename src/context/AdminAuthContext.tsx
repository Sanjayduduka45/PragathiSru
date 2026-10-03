import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { JuryService } from '../services/juryService';
import { sessionManager, type AuthState } from '../services/sessionManager';

export interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  isAdmin: boolean;
  isJudge: boolean;
  isJury: boolean;
  loading: boolean;
  authState: AuthState;
  isRefreshing: boolean;
  isSupabaseReady: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(sessionManager.getCurrentUser());
  const [session, setSession] = useState<Session | null>(sessionManager.getCurrentSession());
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(sessionManager.getAuthState());

  const roleCache = React.useRef(new Map<string, { role: string | null; timestamp: number }>());

  const resolveUserRole = async (userObj: User | null): Promise<string | null> => {
    if (!userObj || !userObj.id) return null;

    const cached = roleCache.current.get(userObj.id);
    if (cached && Date.now() - cached.timestamp < 15000) {
      return cached.role;
    }

    let resolvedRole: string | null = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userObj.id)
          .maybeSingle();

        if (roleRow && roleRow.role) {
          const rawRole = roleRow.role.toLowerCase();
          if (rawRole === 'jury' || rawRole === 'judge') resolvedRole = 'jury';
          else if (rawRole === 'admin' || rawRole === 'superadmin' || rawRole === 'coordinator') resolvedRole = 'admin';
          else if (rawRole === 'participant') resolvedRole = 'participant';
          else resolvedRole = rawRole;
        }
      } catch (err) {
        console.warn('[AdminAuthContext] Role lookup failed:', err);
      }
    }

    // Fallback: check user_metadata from auth token
    if (!resolvedRole) {
      const metaRole = userObj.user_metadata?.role;
      if (metaRole) {
        const lower = String(metaRole).toLowerCase();
        if (lower === 'jury' || lower === 'judge') resolvedRole = 'jury';
        else if (lower === 'admin' || lower === 'superadmin' || lower === 'coordinator') resolvedRole = 'admin';
        else if (lower === 'participant') resolvedRole = 'participant';
        else resolvedRole = lower;
      }
    }

    roleCache.current.set(userObj.id, { role: resolvedRole, timestamp: Date.now() });
    return resolvedRole;
  };

  useEffect(() => {
    const unsubscribe = sessionManager.onAuthStateChange(async (newState, newSession) => {
      setAuthState(newState);
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const resolvedRole = await resolveUserRole(currentUser);
        setRole(resolvedRole);
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null; role?: string | null }> => {
    if (!supabase) {
      return {
        error: 'Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    if (data.session) {
      sessionManager.applySession(data.session);
    }
    setSession(data.session);
    setUser(data.user);
    const userRole = await resolveUserRole(data.user);
    setRole(userRole);
    return { error: null, role: userRole };
  };

  const signOut = async () => {
    roleCache.current.clear();
    JuryService.clearBootstrapCache();
    await sessionManager.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const isRoleAdmin = role === 'admin' || role === 'superadmin' || role === 'coordinator';
  const isAdmin = (authState === 'AUTHENTICATED' || authState === 'REFRESHING') && isRoleAdmin;
  const isJury = (authState === 'AUTHENTICATED' || authState === 'REFRESHING') && (role === 'jury' || role === 'judge');
  const isJudge = isJury;
  const isRefreshing = authState === 'REFRESHING';

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin,
        isJudge,
        isJury,
        loading,
        authState,
        isRefreshing,
        isSupabaseReady: isSupabaseConfigured,
        signIn,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
