import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  isAdmin: boolean;
  isJudge: boolean;
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

  const resolveUserRole = async (userObj: User | null): Promise<string | null> => {
    if (!userObj || !userObj.email) return null;
    const email = userObj.email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, is_active')
          .ilike('user_email', email)
          .limit(1);

        if (!error && data && data.length > 0) {
          if (data[0].is_active === false) {
            return 'inactive';
          }
          const rawRole = (data[0].role || '').toLowerCase();
          if (rawRole === 'judge' || rawRole === 'jury') return 'judge';
          if (rawRole === 'admin' || rawRole === 'superadmin' || rawRole === 'coordinator') return 'admin';
          if (rawRole === 'participant') return 'participant';
          return 'admin';
        }
      } catch (err) {
        console.warn('[AdminAuthContext] Role lookup failed:', err);
      }
    }

    // Check user_metadata from auth token
    const metaRole = userObj.user_metadata?.role;
    if (metaRole) {
      const lower = String(metaRole).toLowerCase();
      if (lower === 'judge' || lower === 'jury') return 'judge';
      if (lower === 'participant') return 'participant';
      return 'admin';
    }

    // Local Storage judges check
    try {
      const localJudgesRaw = localStorage.getItem('pragathi_local_judges');
      if (localJudgesRaw) {
        const parsed = JSON.parse(localJudgesRaw);
        const match = parsed.find((j: any) => (j.userEmail || '').toLowerCase() === email);
        if (match) {
          if (match.isActive === false) return 'inactive';
          return 'judge';
        }
      }
    } catch {
      // ignore
    }

    // Default to admin for authenticated Supabase admin users if no specific role assigned
    return 'admin';
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

  const signIn = async (email: string, password: string): Promise<{ error: string | null; role?: string }> => {
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
    return { error: null, role: userRole || 'admin' };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const isAdmin = role === 'admin' || role === 'superadmin';
  const isJudge = role === 'judge' || role === 'jury';

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin,
        isJudge,
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
