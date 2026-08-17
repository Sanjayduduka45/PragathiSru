/**
 * projectService.ts - Project Catalog & Lookup Service
 *
 * Frontend service boundary for accessing registered projects, teams, and metadata.
 */

import { Project, ParticipantMember } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export class ProjectService {
  /**
   * Fetch all registered projects
   */
  public static async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('*, team_members(*), projects(*), institutions(*)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((reg: any) => {
            const proj = Array.isArray(reg.projects) ? reg.projects[0] : reg.projects;
            const inst = Array.isArray(reg.institutions) ? reg.institutions[0] : reg.institutions;
            const members: ParticipantMember[] = (reg.team_members || []).map((m: any) => ({
              name: m.name || '',
              email: m.email || '',
              phone: m.mobile || '',
              role: m.is_team_leader ? 'Leader' : 'Member',
              rollNumber: m.roll_number,
              department: m.department,
            }));

            const leaderMember = members.find((m) => m.role === 'Leader') || members[0];

            return {
              id: reg.id,
              registrationId: (reg.registration_id || '').toUpperCase(),
              teamName: reg.team_name || 'Team',
              title: proj?.title || 'Project Title',
              category: proj?.category || 'General',
              institutionName: inst?.name || reg.institution_name || 'SR University',
              leaderName: reg.leader_name || leaderMember?.name || 'Leader',
              leaderEmail: reg.leader_email || leaderMember?.email || '',
              members,
              problemStatement: proj?.problem_statement || '',
              proposedSolution: proj?.proposed_solution || '',
              innovation: proj?.innovation || '',
              expectedOutcomes: proj?.expected_outcomes || '',
              status: reg.registration_status || 'submitted',
            };
          });
        }
      } catch (err) {
        console.warn('[projectService] getProjects error:', err);
      }
    }

    // Default empty list when no database projects exist
    return [];
  }

  /**
   * Find project by registration ID (used during QR code scan or manual search)
   */
  public static async getProjectByRegistrationId(registrationId: string): Promise<Project | null> {
    const cleanId = registrationId.trim().toUpperCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('*, team_members(*), projects(*), institutions(*)')
          .eq('registration_id', cleanId)
          .limit(1);

        if (!error && data && data.length > 0) {
          const reg = data[0];
          const proj = Array.isArray(reg.projects) ? reg.projects[0] : reg.projects;
          const inst = Array.isArray(reg.institutions) ? reg.institutions[0] : reg.institutions;
          const members: ParticipantMember[] = (reg.team_members || []).map((m: any) => ({
            name: m.name || '',
            email: m.email || '',
            phone: m.mobile || '',
            role: m.is_team_leader ? 'Leader' : 'Member',
            rollNumber: m.roll_number,
            department: m.department,
          }));

          return {
            id: reg.id,
            registrationId: reg.registration_id.toUpperCase(),
            teamName: reg.team_name,
            title: proj?.title || 'Project Title',
            category: proj?.category || 'General',
            institutionName: inst?.name || reg.institution_name || 'SR University',
            leaderName: reg.leader_name || members[0]?.name || 'Leader',
            leaderEmail: reg.leader_email || members[0]?.email || '',
            members,
            problemStatement: proj?.problem_statement || '',
            proposedSolution: proj?.proposed_solution || '',
            innovation: proj?.innovation || '',
            expectedOutcomes: proj?.expected_outcomes || '',
            status: reg.registration_status || 'submitted',
          };
        }
      } catch (err) {
        console.warn('[projectService] getProjectByRegistrationId error:', err);
      }
    }

    return null;
  }
}
