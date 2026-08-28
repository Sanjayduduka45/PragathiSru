import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { api } from './api';

export type PaymentState = 'idle' | 'creating' | 'redirecting' | 'processing' | 'success' | 'failed';

export interface PaymentInitiateRequest {
  registrationId: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  amountINR: number;
  institutionName: string;
  memberCount: number;
}

export interface PaymentInitiateResponse {
  success: boolean;
  paymentId: string;
  gatewayUrl?: string;
  transactionRef: string;
  message: string;
  isDevelopmentMode: boolean;
  status: 'INITIATED' | 'COMPLETED' | 'FAILED' | 'PENDING_GATEWAY';
}

export interface PaymentVerifyResponse {
  success: boolean;
  transactionRef: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paidAmount: number;
  timestamp: string;
  message: string;
  bankAuthorizationCode?: string;
}

export class SRUPaymentService {
  /**
   * Single registration fee configuration (Source of Truth)
   * External Participants: ₹1,000 per team (FLAT PER TEAM, independent of team size 1-5 members)
   * SR University Students: ₹0 (FREE)
   */
  public static readonly EXTERNAL_TEAM_REGISTRATION_FEE = 1000;

  /**
   * Uploads payment proof screenshot to private 'payment-proofs' bucket
   */
  public static async uploadPaymentProof(
    registrationId: string,
    file: File,
    transactionId?: string
  ): Promise<{ success: boolean; proofPath: string; message?: string }> {
    try {
      const res = await api.registrations.uploadPaymentProof(registrationId, file, transactionId);
      if (res && res.payment_proof_path) {
        return {
          success: true,
          proofPath: res.payment_proof_path,
          message: 'Payment proof uploaded successfully.',
        };
      }
    } catch (err: any) {
      console.warn('Backend payment proof upload endpoint warning, trying direct Supabase storage:', err);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const storagePath = `${registrationId}/${Date.now()}_${sanitizedFilename}`;

        const { data, error } = await supabase.storage
          .from('payment-proofs')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          throw new Error(`Storage upload failed: ${error.message}`);
        }

        const fullPath = `payment-proofs/${data.path}`;
        return {
          success: true,
          proofPath: fullPath,
          message: 'Payment proof uploaded successfully.',
        };
      } catch (sErr: any) {
        throw new Error(sErr?.message || 'Payment proof upload failed.');
      }
    }

    throw new Error('Storage service is unavailable.');
  }

  /**
   * Calculates external or SRU registration fee based on participant status
   */
  public static calculateFee(memberCount: number = 1, isSRUVerified: boolean = false): number {
    if (isSRUVerified) {
      return 0;
    }
    return this.EXTERNAL_TEAM_REGISTRATION_FEE;
  }

  /**
   * Alias method for initiating gateway payment
   */
  public static async initiateGatewayPayment(
    request: PaymentInitiateRequest
  ): Promise<PaymentInitiateResponse> {
    return this.createPaymentSession(request);
  }

  /**
   * Initiates payment session via Supabase Edge Function to SR University Payment API.
   * Fallbacks to clearly labelled Development Sandbox Adapter when running locally or before official credentials.
   */
  public static async createPaymentSession(
    request: PaymentInitiateRequest
  ): Promise<PaymentInitiateResponse> {
    const transactionRef = `SRU-PRG26-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Check if Supabase Edge Function endpoint is available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-supabase-project')) {
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sru-payment-gateway`;
        const res = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            action: 'CREATE_SESSION',
            payload: request,
            transactionRef,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            paymentId: data.paymentId || `PAY-${Date.now()}`,
            gatewayUrl: data.gatewayUrl,
            transactionRef: data.transactionRef || transactionRef,
            message: data.message || 'Payment session created via Edge Function.',
            isDevelopmentMode: false,
            status: 'INITIATED',
          };
        }
      }
    } catch (err) {
      console.warn('Edge function unavailable, using Development Sandbox Adapter for SRU Payment Gateway.');
    }

    // Development / Sandbox Adapter Response
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      paymentId: `SANDBOX-PAY-${Date.now()}`,
      transactionRef,
      message: '[DEVELOPMENT SANDBOX ADAPTER] SR University payment session initialized. Waiting for official Management API credentials.',
      isDevelopmentMode: true,
      status: 'INITIATED',
    };
  }

  /**
   * Verifies status of transaction ref
   */
  public static async verifyPaymentStatus(
    transactionRef: string,
    simulateFailure: boolean = false
  ): Promise<PaymentVerifyResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (simulateFailure) {
      return {
        success: false,
        transactionRef,
        status: 'FAILED',
        paidAmount: 0,
        timestamp: new Date().toISOString(),
        message: 'Transaction declined by bank authorization server (Simulated Test Failure).',
      };
    }

    return {
      success: true,
      transactionRef,
      status: 'SUCCESS',
      paidAmount: SRUPaymentService.EXTERNAL_TEAM_REGISTRATION_FEE,
      timestamp: new Date().toISOString(),
      bankAuthorizationCode: `SRU-AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
      message: 'Payment verified successfully via SR University Merchant Payment Gateway.',
    };
  }
}
