/**
 * opportunityEnquiryService.ts
 *
 * Dedicated service for Opportunity Enquiries submitted via the "Get Involved" carousel.
 * Supabase `opportunity_enquiries` is the single source of truth.
 *
 * - Public: Submit new opportunity enquiries.
 * - Admin: Fetch all enquiries, view details, and update status.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type EnquiryStatus = 'new' | 'contacted' | 'closed';

export interface OpportunityEnquiry {
  id: string;
  opportunityName: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface SubmitEnquiryPayload {
  opportunityName: string;
  fullName: string;
  email: string;
  phone: string;
  organization?: string;
  designation?: string;
  message?: string;
}

export class OpportunityEnquiryService {
  /**
   * Submit an enquiry from public modal form directly into Supabase
   */
  static async submitEnquiry(payload: SubmitEnquiryPayload): Promise<{ success: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Database service is currently unavailable. Please try again later or contact support.',
      };
    }

    const trimmedPayload = {
      opportunity_name: payload.opportunityName.trim(),
      full_name: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      organization: (payload.organization || '').trim(),
      designation: (payload.designation || '').trim(),
      message: (payload.message || '').trim(),
      status: 'new',
    };

    if (!trimmedPayload.full_name || !trimmedPayload.email || !trimmedPayload.phone) {
      return { success: false, message: 'Please provide your full name, email, and phone number.' };
    }

    try {
      const { error } = await supabase
        .from('opportunity_enquiries')
        .insert([trimmedPayload]);

      if (error) {
        console.error('Failed to submit opportunity enquiry to Supabase:', error);
        return {
          success: false,
          message: error.message || 'Failed to submit enquiry. Please try again.',
        };
      }

      return {
        success: true,
        message: 'Your interest has been submitted successfully.',
      };
    } catch (err: any) {
      console.error('Submit enquiry network error:', err);
      return {
        success: false,
        message: 'A network error occurred while submitting your enquiry. Please check your connection and retry.',
      };
    }
  }

  /**
   * Fetch all enquiries for authorized PRAGATHI Admins
   */
  static async getEnquiries(): Promise<{ success: boolean; data: OpportunityEnquiry[]; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        data: [],
        message: 'Database service is not configured.',
      };
    }

    try {
      const { data, error } = await supabase
        .from('opportunity_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch opportunity enquiries from Supabase:', error);
        return {
          success: false,
          data: [],
          message: error.message || 'Failed to load enquiries.',
        };
      }

      const mapped: OpportunityEnquiry[] = (data || []).map((row: any) => ({
        id: row.id,
        opportunityName: row.opportunity_name || '',
        fullName: row.full_name || '',
        email: row.email || '',
        phone: row.phone || '',
        organization: row.organization || '',
        designation: row.designation || '',
        message: row.message || '',
        status: (row.status || 'new') as EnquiryStatus,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at,
      }));

      return { success: true, data: mapped };
    } catch (err: any) {
      console.error('Fetch enquiries error:', err);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch enquiries due to a network error.',
      };
    }
  }

  /**
   * Update enquiry status (new | contacted | closed) for authorized PRAGATHI Admins
   */
  static async updateStatus(id: string, status: EnquiryStatus): Promise<{ success: boolean; message?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        message: 'Database service is not configured.',
      };
    }

    try {
      const { error } = await supabase
        .from('opportunity_enquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Failed to update enquiry status in Supabase:', error);
        return {
          success: false,
          message: error.message || 'Failed to update enquiry status.',
        };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Update enquiry status error:', err);
      return {
        success: false,
        message: 'A network error occurred while updating the status.',
      };
    }
  }
}
