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
  leaderName: string;
  leaderEmail: string;
  isCurrentUserLeader: boolean;
  currentUserEmail: string;
  createdAt: string;
}

export interface ParticipantSession {
  registrationId: string;
  userEmail: string;
  leaderEmail: string;
  isLeader: boolean;
}

interface ParticipantAuthContextType {
  session: ParticipantSession | null;
  profile: ParticipantProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (registrationId: string, userEmail: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const SESSION_KEY = 'pragathi_participant_session';

const ParticipantAuthContext = createContext<ParticipantAuthContextType | null>(null);

export const ParticipantAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (registrationId: string, userEmail?: string): Promise<void> => {
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

      const leaderMember = members.find((m) => m.role === 'Leader') || members[0];
      const leaderEmail = (regRow.leader_email as string) || leaderMember?.email || '';
      const leaderName = (regRow.leader_name as string) || leaderMember?.name || '';

      const currentEmail = (userEmail || '').trim().toLowerCase();
      const isCurrentUserLeader = currentEmail
        ? currentEmail === leaderEmail.trim().toLowerCase() ||
          members.some((m) => m.email.trim().toLowerCase() === currentEmail && m.role === 'Leader')
        : true;

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
        leaderName,
        leaderEmail,
        isCurrentUserLeader,
        currentUserEmail: currentEmail || leaderEmail,
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
        void loadProfile(stored.registrationId, stored.userEmail);
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  const signIn = async (
    registrationId: string,
    userEmail: string
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'The database is not configured. Please contact the event organizers.' };
    }
    const cleanId = registrationId.trim().toUpperCase();
    const cleanEmail = userEmail.trim().toLowerCase();
    try {
      const { data: regRow, error } = await supabase
        .from('registrations')
        .select('*, team_members(*)')
        .eq('registration_id', cleanId)
        .single();

      if (error || !regRow) {
        return { error: 'Registration ID or email not found. Please check your details and try again.' };
      }

      const dbLeaderEmail = (regRow.leader_email || '').trim().toLowerCase();
      const members = (regRow.team_members as Array<{ email?: string; is_team_leader?: boolean }>) || [];

      const isMember =
        cleanEmail === dbLeaderEmail ||
        members.some((tm) => (tm.email || '').trim().toLowerCase() === cleanEmail);

      if (!isMember) {
        return { error: 'Registration ID or email not found. Please check your details and try again.' };
      }

      const isLeader =
        cleanEmail === dbLeaderEmail ||
        members.some((tm) => (tm.email || '').trim().toLowerCase() === cleanEmail && tm.is_team_leader);

      const sess: ParticipantSession = {
        registrationId: cleanId,
        userEmail: cleanEmail,
        leaderEmail: dbLeaderEmail,
        isLeader,
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      setSession(sess);
      await loadProfile(cleanId, cleanEmail);
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
