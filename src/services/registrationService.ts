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
  paymentProofPath?: string;

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

/**
 * Exact 10 Official PRAGATHI 2K26 Domain Codes
 */
export const DOMAIN_CODES: Record<string, string> = {
  'civil-engineering-smart-infrastructure': 'CIV',
  'electrical-engineering-energy-systems': 'EEE',
  'mechanical-engineering-automation': 'MECH',
  'electronics-communication-technologies': 'ECT',
  'computer-science-artificial-intelligence': 'CSAI',
  'business-management-entrepreneurship': 'BME',
  'agriculture-agri-innovation': 'AGR',
  'healthcare-biomedical-innovations': 'HBI',
  'multidisciplinary-smart-solution': 'MIS',
  'school-innovation-young-innovators': 'SIY',
};

/**
 * Maps any category identifier, title, or substring to the authoritative 3-4 letter Domain Code
 */
export function getDomainCode(category: string): string {
  if (!category) return 'MIS';
  const c = category.trim().toLowerCase();

  if (DOMAIN_CODES[c]) return DOMAIN_CODES[c];

  if (c.includes('civil') || c === 'civ') return 'CIV';
  if (c.includes('electrical') || c.includes('energy') || c === 'eee') return 'EEE';
  if (c.includes('mechanical') || c.includes('automation') || c === 'mech') return 'MECH';
  if (c.includes('electronic') || c.includes('communication') || c === 'ect' || c === 'ece') return 'ECT';
  if (c.includes('computer') || c.includes('artificial') || c === 'csai' || c === 'cse' || c.includes(' ai')) return 'CSAI';
  if (c.includes('business') || c.includes('management') || c.includes('entrepreneur') || c === 'bme') return 'BME';
  if (c.includes('agri') || c === 'agr') return 'AGR';
  if (c.includes('health') || c.includes('biomed') || c === 'hbi') return 'HBI';
  if (c.includes('school') || c.includes('young') || c === 'siy') return 'SIY';
  if (c.includes('multidisciplinary') || c === 'mis') return 'MIS';

  return 'MIS';
}

/**
 * The 3 test development emails (case-insensitive & trimmed)
 */
export const TEST_EMAILS = [
  'sanjayduduka70@gmail.com',
  'dgandesri@gmail.com',
  'sanjaysanju1259@gmail.com',
];

export function isTestEmail(email?: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return TEST_EMAILS.includes(normalized);
}

export function isTestPayload(payload: RegistrationPayload): boolean {
  if (isTestEmail(payload.verifiedSRUEmail)) return true;
  for (const m of payload.members || []) {
    if (isTestEmail(m.email)) return true;
  }
  return false;
}

export function formatRegistrationNumber(num: number): string {
  if (num < 10) {
    return `0${num}`;
  }
  return `${num}`;
}

export class RegistrationService {
  /**
   * Helper to retrieve persistent local counter backup
   */
  private static getLocalCounter(domainCode: string, isTest: boolean): number {
    try {
      const stored = localStorage.getItem('pragathi_domain_counters');
      if (stored) {
        const parsed = JSON.parse(stored);
        const key = `${isTest ? 'TEST' : 'REAL'}_${domainCode}`;
        return typeof parsed[key] === 'number' ? parsed[key] : 0;
      }
    } catch {
      // Ignore local storage error
    }
    return 0;
  }

  /**
   * Helper to update persistent local counter backup
   */
  private static updateLocalCounter(domainCode: string, isTest: boolean, newNum: number): void {
    try {
      const stored = localStorage.getItem('pragathi_domain_counters');
      const parsed = stored ? JSON.parse(stored) : {};
      const key = `${isTest ? 'TEST' : 'REAL'}_${domainCode}`;
      const existing = typeof parsed[key] === 'number' ? parsed[key] : 0;
      if (newNum > existing) {
        parsed[key] = newNum;
        localStorage.setItem('pragathi_domain_counters', JSON.stringify(parsed));
      }
    } catch {
      // Ignore local storage error
    }
  }

  /**
   * Generates the next sequential unique Registration ID for the given domain.
   * Format:
   *   Real: PRAGATHI26-{DOMAIN_CODE}{NUMBER}  (e.g., PRAGATHI26-CIV01, PRAGATHI26-CSAI09, PRAGATHI26-CIV100)
   *   Test: TEST-{DOMAIN_CODE}{NUMBER}        (e.g., TEST-CIV01, TEST-CSAI01)
   *
   * Counters are persisted domain-wise and never decrement on deletion.
   */
  public static async generateNextRegistrationId(
    category: string,
    isTest: boolean
  ): Promise<string> {
    const domainCode = getDomainCode(category);
    const prefix = isTest ? `TEST-${domainCode}` : `PRAGATHI26-${domainCode}`;

    // 1. Try Supabase Atomic RPC if available
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_next_registration_id', {
          p_domain_code: domainCode,
          p_is_test: isTest,
        });

        if (!error && data && typeof data === 'string') {
          const numStr = data.replace(prefix, '');
          const parsed = parseInt(numStr, 10);
          if (!isNaN(parsed)) {
            this.updateLocalCounter(domainCode, isTest, parsed);
          }
          return data;
        }
      } catch (rpcErr) {
        // RPC not created or errored, proceed to table-level or query fallback
      }

      // 2. Try Supabase domain_counters table
      try {
        const { data: counterRows, error: fetchErr } = await supabase
          .from('domain_counters')
          .select('*')
          .eq('domain_code', domainCode)
          .limit(1);

        if (!fetchErr && counterRows) {
          let nextNum = 1;
          if (counterRows.length > 0) {
            const row = counterRows[0];
            const currentVal = isTest ? (row.last_test_number || 0) : (row.last_real_number || 0);
            nextNum = currentVal + 1;

            const updatePayload = isTest
              ? { last_test_number: nextNum, updated_at: new Date().toISOString() }
              : { last_real_number: nextNum, updated_at: new Date().toISOString() };

            await supabase
              .from('domain_counters')
              .update(updatePayload)
              .eq('domain_code', domainCode);
          } else {
            // First time row insertion
            const insertPayload = {
              domain_code: domainCode,
              last_real_number: isTest ? 0 : 1,
              last_test_number: isTest ? 1 : 0,
              updated_at: new Date().toISOString(),
            };
            await supabase.from('domain_counters').insert([insertPayload]);
            nextNum = 1;
          }

          this.updateLocalCounter(domainCode, isTest, nextNum);
          return `${prefix}${formatRegistrationNumber(nextNum)}`;
        }
      } catch (tblErr) {
        // domain_counters table might not be created yet, fallback to highest scanned ID
      }

      // 3. Fallback: Query registrations table to find the highest allocated number for this domain prefix
      try {
        const searchPattern = `${prefix}%`;
        const { data: regRows } = await supabase
          .from('registrations')
          .select('registration_id')
          .like('registration_id', searchPattern);

        let maxNum = 0;
        if (regRows && regRows.length > 0) {
          for (const r of regRows) {
            const rawId = (r.registration_id || '').trim();
            if (rawId.startsWith(prefix)) {
              const numPart = parseInt(rawId.slice(prefix.length), 10);
              if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
              }
            }
          }
        }

        const localMax = this.getLocalCounter(domainCode, isTest);
        const nextNum = Math.max(maxNum, localMax) + 1;

        this.updateLocalCounter(domainCode, isTest, nextNum);
        return `${prefix}${formatRegistrationNumber(nextNum)}`;
      } catch (queryErr) {
        // Fallback to local storage counter
      }
    }

    // 4. Offline / Local fallback: Use persistent localStorage domain counters
    const localMax = this.getLocalCounter(domainCode, isTest);
    const nextNum = localMax + 1;
    this.updateLocalCounter(domainCode, isTest, nextNum);
    return `${prefix}${formatRegistrationNumber(nextNum)}`;
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

    // Temporary restriction: SR University student registration is currently closed
    if (payload.registrationType === 'SRU_STUDENT') {
      return {
        valid: false,
        message: 'Registration for SR University students using an @sru.edu.in email address is currently closed.',
      };
    }

    for (let i = 0; i < (payload.members || []).length; i++) {
      const mEmail = (payload.members[i]?.email || '').trim().toLowerCase();
      if (mEmail.endsWith('@sru.edu.in')) {
        return {
          valid: false,
          message: 'Registration for SR University students using an @sru.edu.in email address is currently closed.',
        };
      }
    }

    if (!payload.institutionName || payload.institutionName.trim().length === 0) {
      return {
        valid: false,
        message: 'School or College Institution Name is required for external participants.',
      };
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

    const isTest = isTestPayload(payload);
    const publicRegistrationId = await this.generateNextRegistrationId(payload.category, isTest);
    const createdAt = new Date().toISOString();

    const participantTypeDB = payload.registrationType === 'SRU_STUDENT' ? 'sru_student' : 'external_student';
    const paymentStatusDB = payload.registrationType === 'SRU_STUDENT' ? 'not_required' : 'pending';

    const paymentAmount = SRUPaymentService.calculateFee(
      payload.members.length,
      payload.registrationType === 'SRU_STUDENT' || !!payload.isVerifiedSRU
    );

    const leader = payload.members[0];

    const record: RegistrationRecord = {
      ...payload,
      registrationId: publicRegistrationId,
      createdAt,
      paymentStatus: payload.registrationType === 'SRU_STUDENT' ? 'FREE_SRU' : 'PENDING',
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

        // B. Insert Registration Row into public.registrations with collision retry
        let regData: { id: string } | null = null;
        let regError: any = null;
        let finalRegId = publicRegistrationId;

        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) {
            finalRegId = await this.generateNextRegistrationId(payload.category, isTest);
            record.registrationId = finalRegId;
          }

          const insertRes = await supabase
            .from('registrations')
            .insert([
              {
                registration_id: finalRegId,
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
                payment_reference: payload.paymentProofPath || payload.transactionRef || null,
              },
            ])
            .select('id')
            .single();

          regData = insertRes.data;
          regError = insertRes.error;

          if (!regError && regData?.id) {
            break;
          }

          // If error is not unique violation (23505), don't keep retrying
          if (regError && regError.code !== '23505') {
            break;
          }
        }

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
          const paymentPayload: any = {
            registration_id: internalRegUUID, // Guaranteed UUID foreign key to registrations.id
            amount: paymentAmount,
            currency: 'INR',
            status: 'pending',
            gateway_reference: payload.paymentProofPath || payload.transactionRef || null,
            transaction_id: payload.transactionRef || null,
            payment_proof_path: payload.paymentProofPath || null,
          };

          let { error: paymentError } = await supabase.from('payments').insert([paymentPayload]);

          // Fallback if payment_proof_path column is missing in schema cache
          if (paymentError && (paymentError.message?.includes('payment_proof_path') || paymentError.code === 'PGRST205')) {
            delete paymentPayload.payment_proof_path;
            const fallbackRes = await supabase.from('payments').insert([paymentPayload]);
            paymentError = fallbackRes.error;
          }

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
              message: 'Registration payment record creation failed. Please try again.',
            };
          }
        }

        // Save local copy ONLY AFTER successful database insert of all records
        this.saveToLocalStorage(record);

        // 3. Trigger registration confirmation email process ONLY for SRU Students (Free)
        // External participants receive confirmation email ONLY AFTER admin approval.
        if (payload.registrationType === 'SRU_STUDENT') {
          try {
            console.log(`[EMAIL] Registration confirmed for SRU Student: ${finalRegId}`);
            console.log('[EMAIL] Invoking send-registration-confirmation');
            supabase.functions
              .invoke('send-registration-confirmation', {
                body: { registrationId: finalRegId },
              })
              .then(({ data, error }) => {
                if (error) {
                  console.error('[EMAIL] Function invocation failed:', error.message || error);
                } else {
                  console.log('[EMAIL] Function response received:', data);
                }
              })
              .catch((emailErr) => {
                console.error('[EMAIL] Function invocation failed:', emailErr?.message || emailErr);
              });
          } catch (emailTriggerErr: any) {
            console.error('[EMAIL] Function invocation failed:', emailTriggerErr?.message || emailTriggerErr);
          }
        } else {
          console.log(`[EMAIL] External registration ${finalRegId} submitted. Confirmation email deferred until Admin approval.`);
        }

        return {
          success: true,
          registrationId: finalRegId,
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
   * Retrieves a registration record by Registration ID
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
      const filtered = existing.filter((r) => r.registrationId !== record.registrationId);
      filtered.unshift(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  public static async resendConfirmationEmail(
    registrationId: string,
    memberId?: string
  ): Promise<{ success: boolean; message: string; results?: any }> {
    if (!registrationId) return { success: false, message: 'Missing Registration ID.' };

    if (isSupabaseConfigured && supabase) {
      try {
        console.log(`[EMAIL] Invoking send-registration-confirmation for resend: ${registrationId}`);
        const { data, error } = await supabase.functions.invoke('send-registration-confirmation', {
          body: { registrationId, memberId, forceResend: true },
        });

        if (error) {
          console.error('[EMAIL] Function invocation failed:', error.message || error);
          return { success: false, message: error.message || 'Failed to trigger confirmation email.' };
        }

        console.log('[EMAIL] Function response received:', data);
        return {
          success: true,
          message: 'Confirmation email process triggered successfully.',
          results: data?.results,
        };
      } catch (err: any) {
        console.error('[EMAIL] Function invocation failed:', err?.message || err);
        return {
          success: false,
          message: err?.message || 'Network error while triggering confirmation email.',
        };
      }
    }

    return { success: false, message: 'Supabase database is offline.' };
  }

  public static async getEmailLogs(registrationId: string): Promise<any[]> {
    if (!registrationId || !isSupabaseConfigured || !supabase) return [];
    try {
      let q = supabase.from('registration_email_logs').select('*');
      if (registrationId.length === 36 && registrationId.includes('-')) {
        q = q.or(`registration_id.eq.${registrationId},registration_code.eq.${registrationId}`);
      } else {
        q = q.eq('registration_code', registrationId);
      }
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) {
        console.warn('Failed to fetch registration email logs:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Exception fetching email logs:', err);
      return [];
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
