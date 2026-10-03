import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { JuryService } from '../services/juryService';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  isAdmin: boolean;
  isJudge: boolean;
  isJury: boolean;
  loading: boolean;
  isSupabaseReady: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: string }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      const resolvedRole = await resolveUserRole(currentUser);
      setRole(resolvedRole);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      const resolvedRole = await resolveUserRole(currentUser);
      setRole(resolvedRole);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    setSession(data.session);
    setUser(data.user);
    const userRole = await resolveUserRole(data.user);
    setRole(userRole);
    return { error: null, role: userRole };
  };

  const signOut = async () => {
    roleCache.current.clear();
    JuryService.clearBootstrapCache();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'coordinator';
  const isJury = role === 'jury' || role === 'judge';
  const isJudge = isJury;

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
