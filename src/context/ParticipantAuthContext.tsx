import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface ParticipantMember {
  name: string;
  email: string;
  phone: string;
  role: 'Leader' | 'Member';
  rollNumber?: string;
  classOrYear?: string;
  department?: string;
}

export interface ParticipantProfile {
  registrationId: string;
  teamName: string;
  projectTitle: string;
  category: string;
  institutionName: string;
  department?: string;
  registrationStatus: string;
  paymentStatus: string;
  members: ParticipantMember[];
  createdAt: string;
}

export interface ParticipantSession {
  registrationId: string;
  leaderEmail: string;
}

interface ParticipantAuthContextType {
  session: ParticipantSession | null;
  profile: ParticipantProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (registrationId: string, leaderEmail: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const SESSION_KEY = 'pragathi_participant_session';

const ParticipantAuthContext = createContext<ParticipantAuthContextType | null>(null);

export const ParticipantAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (registrationId: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) return;
    setProfileLoading(true);
    try {
      const { data: regRow, error } = await supabase
        .from('registrations')
        .select('*, team_members(*), projects(*), institutions(*), payments(*)')
        .eq('registration_id', registrationId)
        .single();

      if (error || !regRow) {
        console.warn('ParticipantAuth: profile load failed', error?.message);
        return;
      }

      const members: ParticipantMember[] = (regRow.team_members || []).map(
        (tm: Record<string, unknown>) => ({
          name: tm.name as string,
          email: tm.email as string,
          phone: (tm.mobile as string) || '',
          role: (tm.is_team_leader ? 'Leader' : 'Member') as 'Leader' | 'Member',
          rollNumber: tm.roll_number as string | undefined,
          classOrYear: tm.class_or_year as string | undefined,
          department: tm.department as string | undefined,
        })
      );

      const proj = Array.isArray(regRow.projects) ? regRow.projects[0] : regRow.projects;
      const inst = Array.isArray(regRow.institutions) ? regRow.institutions[0] : regRow.institutions;

      setProfile({
        registrationId: regRow.registration_id as string,
        teamName: regRow.team_name as string,
        projectTitle: (proj?.title as string) || '',
        category: (proj?.category as string) || '',
        institutionName: (inst?.name as string) || (regRow.institution_name as string) || '',
        department: members[0]?.department || (regRow.department as string) || '',
        registrationStatus: (regRow.registration_status as string) || 'submitted',
        paymentStatus: (regRow.payment_status as string) || 'pending',
        members,
        createdAt: regRow.created_at as string,
      });
    } catch (err) {
      console.warn('ParticipantAuth: profile load exception', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const stored: ParticipantSession = JSON.parse(raw);
        setSession(stored);
        void loadProfile(stored.registrationId);
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  const signIn = async (
    registrationId: string,
    leaderEmail: string
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'The database is not configured. Please contact the event organizers.' };
    }
    const cleanId = registrationId.trim().toUpperCase();
    const cleanEmail = leaderEmail.trim().toLowerCase();
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('registration_id, leader_email, team_name')
        .eq('registration_id', cleanId)
        .eq('leader_email', cleanEmail)
        .single();

      if (error || !data) {
        return { error: 'Registration ID or email not found. Please check your details and try again.' };
      }
      const sess: ParticipantSession = { registrationId: cleanId, leaderEmail: cleanEmail };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      setSession(sess);
      await loadProfile(cleanId);
      return { error: null };
    } catch {
      return { error: 'Login failed. Please try again.' };
    }
  };

  const signOut = (): void => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setProfile(null);
  };

  return (
    <ParticipantAuthContext.Provider
      value={{ session, profile, loading, profileLoading, signIn, signOut }}
    >
      {children}
    </ParticipantAuthContext.Provider>
  );
};

export const useParticipantAuth = (): ParticipantAuthContextType => {
  const ctx = useContext(ParticipantAuthContext);
  if (!ctx) throw new Error('useParticipantAuth must be used within ParticipantAuthProvider');
  return ctx;
};
