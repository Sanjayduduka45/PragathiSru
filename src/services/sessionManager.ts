/**
 * sessionManager.ts - Central Frontend Auth & Session Authority
 *
 * Responsibilities:
 * 1. Supabase session bootstrapping.
 * 2. In-memory access-token cache with high-resolution expiry tracking.
 * 3. Proactive refresh before expiry (<= 90 seconds remaining).
 * 4. Single-flight refresh mutex lock (preventing refresh-token rotation races).
 * 5. 401 refresh-and-retry coordination.
 * 6. Long-idle / laptop-sleep / tab visibility recovery (visibilitychange, focus, online).
 * 7. Multi-tab synchronization (via Supabase onAuthStateChange & storage events).
 * 8. Clean logout and cache purging.
 * 9. Explicit Auth State Machine: INITIALIZING | AUTHENTICATED | REFRESHING | UNAUTHENTICATED | ERROR.
 *
 * SECURITY:
 * - Authorization remains strictly backend-authoritative.
 * - ZERO secrets, tokens, or passwords logged or exposed.
 * - No custom admin secrets or service-role keys stored.
 */

import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type AuthState =
  | 'INITIALIZING'
  | 'AUTHENTICATED'
  | 'REFRESHING'
  | 'UNAUTHENTICATED'
  | 'ERROR';

type StateChangeListener = (state: AuthState, session: Session | null) => void;
type RevalidateListener = () => void;

class AuthSessionManager {
  private static instance: AuthSessionManager | null = null;

  private authState: AuthState = 'INITIALIZING';
  private cachedAuthToken: string | null = null;
  private tokenExpiresAt: number = 0; // Epoch milliseconds
  private currentSession: Session | null = null;
  private currentUser: User | null = null;

  // Single-flight refresh mutex lock
  private refreshPromise: Promise<string | null> | null = null;

  // Listeners
  private stateListeners = new Set<StateChangeListener>();
  private revalidateListeners = new Set<RevalidateListener>();

  // Wake / Focus debounce
  private lastWakeCheck: number = 0;

  private initialized: boolean = false;

  private constructor() {
    this.setupListeners();
    this.bootstrapSession();
  }

  public static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager();
    }
    return AuthSessionManager.instance;
  }

  // ─── Lifecycle & Listeners ──────────────────────────────────────────────────

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    // 1. Supabase Auth State Change (handles SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, cross-tab events)
    if (supabase) {
      try {
        supabase.auth.onAuthStateChange((event, session) => {
          if (import.meta.env.DEV) {
            console.debug(`[SessionManager] Auth event: ${event}`);
          }

          if (event === 'SIGNED_OUT') {
            this.clearSession('UNAUTHENTICATED');
            return;
          }

          if (session) {
            this.applySession(session);
            this.setAuthState('AUTHENTICATED');
          } else if (event === 'INITIAL_SESSION' && !session) {
            this.clearSession('UNAUTHENTICATED');
          }
        });
      } catch (err) {
        console.warn('[SessionManager] onAuthStateChange setup failed:', err);
      }
    }

    // 2. Long-Idle / Laptop-Sleep / Tab Visibility Recovery
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleWakeOrVisibilityChange('visibility');
      }
    });

    window.addEventListener('focus', () => {
      this.handleWakeOrVisibilityChange('focus');
    });

    window.addEventListener('online', () => {
      this.handleWakeOrVisibilityChange('online');
    });

    // 3. Cross-Tab Storage Event (sync logout across tabs)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.includes('supabase.auth.token') && !e.newValue) {
        // Token was removed in another tab -> user signed out
        this.clearSession('UNAUTHENTICATED');
      }
    });
  }

  /**
   * Bootstraps the session on application launch.
   */
  private async bootstrapSession(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      this.setAuthState('UNAUTHENTICATED');
      this.initialized = true;
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        this.setAuthState('UNAUTHENTICATED');
      } else {
        this.applySession(data.session);
        this.setAuthState('AUTHENTICATED');
      }
    } catch (err) {
      console.warn('[SessionManager] Bootstrap error:', err);
      this.setAuthState('UNAUTHENTICATED');
    } finally {
      this.initialized = true;
    }
  }

  // ─── Session Application & State ──────────────────────────────────────────

  public applySession(session: Session | null): void {
    if (!session) {
      this.clearSession('UNAUTHENTICATED');
      return;
    }

    this.currentSession = session;
    this.currentUser = session.user ?? null;
    this.cachedAuthToken = session.access_token;

    // Determine token expiration epoch in milliseconds
    if (session.expires_at) {
      // Supabase expires_at is in seconds since epoch
      this.tokenExpiresAt = session.expires_at * 1000;
    } else if (session.expires_in) {
      this.tokenExpiresAt = Date.now() + session.expires_in * 1000;
    } else {
      // Default fallback 1 hour
      this.tokenExpiresAt = Date.now() + 3600 * 1000;
    }
  }

  public clearSession(nextState: AuthState = 'UNAUTHENTICATED'): void {
    this.cachedAuthToken = null;
    this.tokenExpiresAt = 0;
    this.currentSession = null;
    this.currentUser = null;
    this.setAuthState(nextState);
  }

  private setAuthState(newState: AuthState): void {
    if (this.authState === newState) return;
    this.authState = newState;
    this.notifyStateListeners();
  }

  // ─── Token Access & Proactive Refresh ─────────────────────────────────────

  /**
   * Returns a valid access token.
   * - If token is in memory and has > 90 seconds before expiry: returns immediately.
   * - If token is expiring soon (<= 90s) or missing: proactively refreshes using single-flight mutex.
   * - Returns null if user is unauthenticated.
   */
  public async getValidToken(): Promise<string | null> {
    const now = Date.now();
    const proactiveBufferMs = 90 * 1000; // 90 seconds

    // Fast path: healthy token in memory with more than 90 seconds remaining
    if (this.cachedAuthToken && now < this.tokenExpiresAt - proactiveBufferMs) {
      return this.cachedAuthToken;
    }

    // If expired or near-expiry, refresh through single-flight mutex
    return this.refreshSession();
  }

  /**
   * Single-Flight Refresh Mutex.
   * Concurrent callers await the EXACT SAME refresh Promise to prevent token rotation race conditions.
   */
  public async refreshSession(): Promise<string | null> {
    // If a refresh is already in-flight, return the existing Promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.executeRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async executeRefresh(): Promise<string | null> {
    if (!supabase) {
      return null;
    }

    const prevState = this.authState;
    this.setAuthState('REFRESHING');

    try {
      if (import.meta.env.DEV) {
        console.debug('[SessionManager] Refreshing Supabase session (single-flight mutex)...');
      }

      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        const errorMsg = error?.message?.toLowerCase() || '';
        const isRevoked =
          errorMsg.includes('invalid refresh token') ||
          errorMsg.includes('refresh token not found') ||
          errorMsg.includes('already used') ||
          errorMsg.includes('revoked');

        if (isRevoked) {
          console.warn('[SessionManager] Refresh token revoked or invalid. Requiring re-authentication.');
          this.handleSessionRevoked();
          return null;
        }

        // Transient network failure during refresh: keep cached token if not completely expired
        if (this.cachedAuthToken && Date.now() < this.tokenExpiresAt) {
          console.warn('[SessionManager] Transient refresh error, reusing active token:', error?.message);
          this.setAuthState('AUTHENTICATED');
          return this.cachedAuthToken;
        }

        this.clearSession('UNAUTHENTICATED');
        return null;
      }

      // Success
      this.applySession(data.session);
      this.setAuthState('AUTHENTICATED');
      return data.session.access_token;
    } catch (err: any) {
      console.error('[SessionManager] Refresh exception:', err?.message || err);
      if (this.cachedAuthToken && Date.now() < this.tokenExpiresAt) {
        this.setAuthState('AUTHENTICATED');
        return this.cachedAuthToken;
      }
      this.clearSession('ERROR');
      return null;
    }
  }

  // ─── Long-Idle / Sleep / Visibility Recovery ──────────────────────────────

  private async handleWakeOrVisibilityChange(trigger: string): Promise<void> {
    const now = Date.now();
    // Debounce to at most once per 3 seconds
    if (now - this.lastWakeCheck < 3000) return;
    this.lastWakeCheck = now;

    if (!supabase || this.authState === 'UNAUTHENTICATED') return;

    const proactiveBufferMs = 90 * 1000;
    const isNearExpiry = !this.cachedAuthToken || now >= this.tokenExpiresAt - proactiveBufferMs;

    if (isNearExpiry) {
      if (import.meta.env.DEV) {
        console.debug(`[SessionManager] Wake/focus recovery triggered by '${trigger}'. Refreshing session...`);
      }
      const token = await this.refreshSession();
      if (token) {
        this.notifyRevalidateListeners();
      }
    }
  }

  private handleSessionRevoked(): void {
    if (typeof window !== 'undefined') {
      try {
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath && !currentPath.includes('/login')) {
          sessionStorage.setItem('auth_redirect_after_login', currentPath);
        }
      } catch {
        // ignore sessionStorage errors
      }
    }
    this.clearSession('UNAUTHENTICATED');
  }

  // ─── Sign Out ─────────────────────────────────────────────────────────────

  public async signOut(): Promise<void> {
    this.clearSession('UNAUTHENTICATED');
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[SessionManager] Supabase signOut warning:', err);
      }
    }
  }

  // ─── Getters & Subscriptions ──────────────────────────────────────────────

  public getAuthState(): AuthState {
    return this.authState;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getCurrentSession(): Session | null {
    return this.currentSession;
  }

  public getTokenExpiresAt(): number {
    return this.tokenExpiresAt;
  }

  public isReady(): boolean {
    return this.initialized;
  }

  public onAuthStateChange(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    // Immediately call with current state
    listener(this.authState, this.currentSession);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public onRevalidate(listener: RevalidateListener): () => void {
    this.revalidateListeners.add(listener);
    return () => {
      this.revalidateListeners.delete(listener);
    };
  }

  private notifyStateListeners(): void {
    for (const listener of this.stateListeners) {
      try {
        listener(this.authState, this.currentSession);
      } catch (e) {
        console.error('[SessionManager] Listener error:', e);
      }
    }
  }

  public notifyRevalidateListeners(): void {
    for (const listener of this.revalidateListeners) {
      try {
        listener();
      } catch (e) {
        console.error('[SessionManager] Revalidate listener error:', e);
      }
    }
  }
}

export const sessionManager = AuthSessionManager.getInstance();
