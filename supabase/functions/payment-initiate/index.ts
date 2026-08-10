/**
 * Supabase Edge Function: Payment Initiation Placeholder
 * PRAGATHI 2K26 - SR University Payment Gateway Integration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.json();
    const transactionRef = `SRU-PG-${Date.now()}`;

    return new Response(
      JSON.stringify({
        success: true,
        transactionRef,
        amountINR: body.amountINR || 300,
        status: 'INITIATED',
        gatewayUrl: 'https://payments.sru.edu.in/checkout',
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
