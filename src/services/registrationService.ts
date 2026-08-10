import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { SRUPaymentService } from './paymentService';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Leader' | 'Member';
  rollNumber?: string;
  classOrYear?: string;
  department?: string;
}

export interface RegistrationPayload {
  teamName: string;
  category: string;
  projectTitle: string;
  projectAbstract?: string;
  registrationType: 'SRU_STUDENT' | 'EXTERNAL';
  institutionName: string;
  institutionType?: 'school' | 'college' | 'university' | 'School' | 'College / University';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  department?: string;
  members: TeamMember[];
  verifiedSRUEmail?: string;
  isVerifiedSRU?: boolean;
  paymentStatus?: 'FREE_SRU' | 'PENDING' | 'COMPLETED' | 'FREE' | 'PAID';
  transactionRef?: string;

  // Detailed Project Breakdown
  problemStatement?: string;
  objective?: string;
  proposedSolution?: string;
  innovation?: string;
  applications?: string;
  expectedOutcomes?: string;
}

export interface RegistrationRecord extends RegistrationPayload {
  registrationId: string;
  createdAt: string;
}

const STORAGE_KEY = 'pragathi_2k26_registrations';

export class RegistrationService {
  /**
   * Generates public Registration ID in format PRAGATHI26-XXXXXX
   */
  public static generateRegistrationId(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PRAGATHI26-${code}`;
  }

  /**
   * Validates registration payload according to event rules:
   * - Team size must be 1 to 5 members
   * - SRU student email must end with @sru.edu.in
   * - Project title & category required
   */
  public static validateRegistration(payload: RegistrationPayload): { valid: boolean; message: string } {
    if (!payload.members || payload.members.length < 1 || payload.members.length > 5) {
      return {
        valid: false,
        message: 'Invalid team size. Registrations must have between 1 and 5 team members.',
      };
    }

    if (!payload.teamName || payload.teamName.trim().length === 0) {
      return {
        valid: false,
        message: 'Team Name is required.',
      };
    }

    if (!payload.projectTitle || payload.projectTitle.trim().length === 0) {
      return {
        valid: false,
        message: 'Project Title is required.',
      };
    }

    if (!payload.category || payload.category.trim().length === 0) {
      return {
        valid: false,
        message: 'Project Category is required.',
      };
    }

    if (payload.registrationType === 'SRU_STUDENT') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (let i = 0; i < payload.members.length; i++) {
        const mEmail = (payload.members[i]?.email || '').trim().toLowerCase();
        if (!mEmail || !emailRegex.test(mEmail) || !mEmail.endsWith('@sru.edu.in')) {
          return {
            valid: false,
            message: 'All team members must use an eligible email address for free registration.',
          };
        }
      }
    } else {
      if (!payload.institutionName || payload.institutionName.trim().length === 0) {
        return {
          valid: false,
          message: 'School or College Institution Name is required for external participants.',
        };
      }
    }

    return { valid: true, message: 'Validation successful' };
  }

  /**
   * Submits a registration to Supabase relational tables:
   * 1. institutions
   * 2. registrations
   * 3. team_members
   * 4. projects
   * 5. payments
   *
   * Fallbacks safely to local storage if Supabase is offline or unconfigured.
   */
  public static async submitRegistration(
    payload: RegistrationPayload
  ): Promise<{ success: boolean; registrationId: string; message: string; record?: RegistrationRecord }> {
    // 1. Perform validation
    const validation = this.validateRegistration(payload);
    if (!validation.valid) {
      return {
        success: false,
        registrationId: '',
        message: validation.message,
      };
    }

    const publicRegistrationId = this.generateRegistrationId();
    const createdAt = new Date().toISOString();

    const participantTypeDB = payload.registrationType === 'SRU_STUDENT' ? 'sru_student' : 'external_student';
    const paymentStatusDB = payload.registrationType === 'SRU_STUDENT'
      ? 'not_required'
      : (payload.paymentStatus === 'COMPLETED' || payload.paymentStatus === 'PAID' ? 'paid' : 'pending');

    const paymentAmount = SRUPaymentService.calculateFee(
      payload.members.length,
      payload.registrationType === 'SRU_STUDENT' || !!payload.isVerifiedSRU
    );

    const leader = payload.members[0];

    const record: RegistrationRecord = {
      ...payload,
      registrationId: publicRegistrationId,
      createdAt,
      paymentStatus: payload.registrationType === 'SRU_STUDENT' ? 'FREE_SRU' : (payload.paymentStatus || 'COMPLETED'),
    };

    // 2. Try Supabase relational insert (Primary & Authoritative)
    if (isSupabaseConfigured && supabase) {
      try {
        // A. Insert/Get Institution ID
        let institutionId: string | null = null;
        if (payload.institutionName) {
          const instTypeRaw = (payload.institutionType || 'college').toLowerCase();
          const instType = instTypeRaw.includes('school')
            ? 'school'
            : instTypeRaw.includes('university')
            ? 'university'
            : 'college';

          const { data: instData, error: instError } = await supabase
            .from('institutions')
            .insert([
              {
                name: payload.institutionName,
                institution_type: instType,
                address: payload.address || null,
                city: payload.city || null,
                state: payload.state || null,
                country: payload.country || 'India',
              },
            ])
            .select('id')
            .single();

          if (instError) {
            console.error('Supabase institution insert error:', instError);
          } else if (instData?.id) {
            institutionId = instData.id;
          }
        }

        // B. Insert Registration Row into public.registrations
        const { data: regData, error: regError } = await supabase
          .from('registrations')
          .insert([
            {
              registration_id: publicRegistrationId,
              participant_type: participantTypeDB,
              team_name: payload.teamName,
              team_size: payload.members.length,
              institution_id: institutionId,
              leader_name: leader.name,
              leader_email: leader.email,
              leader_mobile: leader.phone || null,
              registration_status: 'submitted',
              payment_status: paymentStatusDB,
              payment_amount: paymentAmount,
              payment_reference: payload.transactionRef || null,
            },
          ])
          .select('id')
          .single();

        if (regError || !regData?.id) {
          console.error('Supabase registration insert error:', {
            message: regError?.message,
            details: regError?.details,
            hint: regError?.hint,
            code: regError?.code,
          });
          return {
            success: false,
            registrationId: '',
            message: 'Registration could not be completed. Please try again.',
          };
        }

        const internalRegUUID = regData.id;

        // C. Insert Team Members
        const memberRows = payload.members.map((m, idx) => ({
          registration_id: internalRegUUID,
          name: m.name,
          roll_number: m.rollNumber || (m.role === 'Leader' ? payload.members[0]?.rollNumber : null),
          email: m.email,
          mobile: m.phone || null,
          class_or_year: m.classOrYear || null,
          department: m.department || payload.department || null,
          is_team_leader: idx === 0 || m.role === 'Leader',
        }));

        const { error: membersError } = await supabase.from('team_members').insert(memberRows);
        if (membersError) {
          console.error('Supabase team_members insert error:', {
            message: membersError.message,
            details: membersError.details,
            hint: membersError.hint,
            code: membersError.code,
          });
          return {
            success: false,
            registrationId: '',
            message: 'Registration could not be completed. Please try again.',
          };
        }

        // D. Insert Project Row
        const { error: projectError } = await supabase.from('projects').insert([
          {
            registration_id: internalRegUUID,
            title: payload.projectTitle,
            category: payload.category,
            problem_statement: payload.problemStatement || payload.projectAbstract || null,
            objective: payload.objective || null,
            proposed_solution: payload.proposedSolution || null,
            innovation: payload.innovation || null,
            applications: payload.applications || null,
            expected_outcomes: payload.expectedOutcomes || null,
          },
        ]);
        if (projectError) {
          console.error('Supabase projects insert error:', {
            message: projectError.message,
            details: projectError.details,
            hint: projectError.hint,
            code: projectError.code,
          });
          return {
            success: false,
            registrationId: '',
            message: 'Registration could not be completed. Please try again.',
          };
        }

        // E. Insert Payment Row (Only for Paid Transactions with amount > 0)
        if (paymentStatusDB !== 'not_required' && paymentAmount > 0) {
          const { error: paymentError } = await supabase.from('payments').insert([
            {
              registration_id: internalRegUUID,
              amount: paymentAmount,
              currency: 'INR',
              status: paymentStatusDB,
              gateway_reference: payload.transactionRef || null,
              transaction_id: payload.transactionRef ? `TXN-${payload.transactionRef}` : null,
            },
          ]);
          if (paymentError) {
            console.error('Supabase payments insert error:', {
              message: paymentError.message,
              details: paymentError.details,
              hint: paymentError.hint,
              code: paymentError.code,
            });
            return {
              success: false,
              registrationId: '',
              message: 'Registration could not be completed. Please try again.',
            };
          }
        }

        // Save local copy ONLY AFTER successful database insert of all records
        this.saveToLocalStorage(record);

        return {
          success: true,
          registrationId: publicRegistrationId,
          message: 'Registration submitted successfully to PRAGATHI 2K26 database!',
          record,
        };
      } catch (err) {
        console.error('Supabase submission exception:', err);
        return {
          success: false,
          registrationId: '',
          message: 'Registration could not be completed. Please try again.',
        };
      }
    }

    return {
      success: false,
      registrationId: '',
      message: 'Registration database is offline. Please try again.',
    };
  }

  /**
   * Retrieves a registration record by Registration ID (PRAGATHI26-XXXXXX)
   */
  public static async getRegistrationById(registrationId: string): Promise<RegistrationRecord | null> {
    if (!registrationId) return null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: regRow } = await supabase
          .from('registrations')
          .select('*, team_members(*), projects(*), institutions(*), payments(*)')
          .eq('registration_id', registrationId)
          .single();

        if (regRow) {
          const members: TeamMember[] = (regRow.team_members || []).map((tm: any, idx: number) => ({
            id: tm.id || `m-${idx}`,
            name: tm.name,
            email: tm.email,
            phone: tm.mobile || '',
            role: tm.is_team_leader ? 'Leader' : 'Member',
            rollNumber: tm.roll_number,
            classOrYear: tm.class_or_year,
            department: tm.department,
          }));

          const proj = Array.isArray(regRow.projects) ? regRow.projects[0] : regRow.projects;
          const inst = Array.isArray(regRow.institutions) ? regRow.institutions[0] : regRow.institutions;

          return {
            registrationId: regRow.registration_id,
            teamName: regRow.team_name,
            category: proj?.category || 'General',
            projectTitle: proj?.title || '',
            projectAbstract: proj?.problem_statement || '',
            registrationType: regRow.participant_type === 'sru_student' ? 'SRU_STUDENT' : 'EXTERNAL',
            institutionName: inst?.name || 'SR University, Warangal',
            department: members[0]?.department || 'School of Engineering',
            members,
            paymentStatus: regRow.payment_status === 'not_required' ? 'FREE_SRU' : 'COMPLETED',
            transactionRef: regRow.payment_reference || '',
            createdAt: regRow.created_at,
          };
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local storage:', err);
      }
    }

    const localList = this.getLocalRegistrations();
    const found = localList.find((r) => r.registrationId === registrationId);
    return found || null;
  }

  private static saveToLocalStorage(record: RegistrationRecord): void {
    try {
      const existing = this.getLocalRegistrations();
      // Avoid duplicates
      const filtered = existing.filter((r) => r.registrationId !== record.registrationId);
      filtered.unshift(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  public static getLocalRegistrations(): RegistrationRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

