/**
 * authService.ts - Central Authentication & Role Resolution Service
 *
 * Frontend service abstraction for authentication.
 * When the backend is implemented, this will connect to the authentication API / Supabase.
 */

import { AppRole, User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface AuthSession {
  user: User | null;
  role: AppRole | null;
  token?: string | null;
}

export interface SignInResult {
  success: boolean;
  role?: AppRole;
  user?: User;
  error?: string;
}

export class AuthService {
  /**
   * Resolves the application redirect URL based strictly on the user's role.
   *   admin       -> /admin
   *   judge       -> /judge
   *   participant -> /participant
   */
  public static getRoleRedirectPath(role: AppRole | string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '/admin';
      case 'judge':
        return '/judge';
      case 'participant':
        return '/participant';
      default:
        return '/login';
    }
  }

  /**
   * Common Sign-In method:
   * 1. Checks participant lookup (email in registrations table or participant list)
   * 2. Checks Supabase Auth for Admin/Judge credentials and resolves role
   * TODO: When backend is ready, replace with unified backend auth endpoint.
   */
  public static async signIn(email: string, password: string): Promise<SignInResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    // ─── Step 1: Participant check (if Supabase is configured) ───
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: regRows } = await supabase
          .from('registrations')
          .select('registration_id')
          .ilike('leader_email', cleanEmail)
          .limit(1);

        if (regRows && regRows.length > 0) {
          // Verify registration_id matches password
          const matchingId = regRows[0].registration_id;
          if (matchingId.toUpperCase() === cleanPassword.toUpperCase()) {
            return {
              success: true,
              role: 'participant',
              user: {
                id: matchingId,
                email: cleanEmail,
                role: 'participant',
                displayName: cleanEmail.split('@')[0],
                isActive: true,
              },
            };
          }
        }
      } catch (err) {
        console.warn('[authService] Participant check notice:', err);
      }

      // ─── Step 2: Supabase Auth for Admin / Judge ───
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!error && data.user) {
          // Resolve role from user_roles
          let resolvedRole: AppRole = 'admin';
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role, is_active, display_name, department')
            .ilike('user_email', cleanEmail)
            .limit(1);

          if (roleData && roleData.length > 0) {
            if (roleData[0].is_active === false) {
              return { success: false, error: 'Your account is currently inactive. Please contact the administrator.' };
            }
            const dbRole = (roleData[0].role || '').toLowerCase();
            if (dbRole === 'judge') resolvedRole = 'judge';
            else if (dbRole === 'participant') resolvedRole = 'participant';
            else resolvedRole = 'admin';
          }

          return {
            success: true,
            role: resolvedRole,
            user: {
              id: data.user.id,
              email: cleanEmail,
              role: resolvedRole,
              displayName: roleData?.[0]?.display_name || cleanEmail.split('@')[0],
              department: roleData?.[0]?.department || '',
              isActive: true,
            },
          };
        }
      } catch (err) {
        console.warn('[authService] Auth check notice:', err);
      }
    }

    // Generic error - never leaks whether email or password check failed
    return {
      success: false,
      error: 'Invalid email or password. Please check your credentials and try again.',
    };
  }

  /**
   * Sign out current user
   */
  public static async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    sessionStorage.removeItem('pragathi_participant_session');
  }
}
