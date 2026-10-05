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

  let body: any = {};
  try {
    body = await req.json();
  } catch (_e) {
    body = {};
  }

  const regType = body.registrationType || body.payload?.registrationType;
  const leaderEmail = (body.leaderEmail || body.payload?.leaderEmail || body.email || '').toString().trim().toLowerCase();
  const isSRU = (regType === 'SRU_STUDENT') || leaderEmail.endsWith('@sru.edu.in');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

  let sruRegistrationOpen = false;
  let externalRegistrationOpen = false;

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/system_settings?key=eq.event_config&select=value`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0]?.value) {
          sruRegistrationOpen = Boolean(rows[0].value.sru_registration_open);
          externalRegistrationOpen = Boolean(rows[0].value.external_registration_open);
        }
      }
    } catch (e) {
      console.error('Failed to query system_settings in payment-initiate edge function:', e);
    }
  }

  if (isSRU) {
    if (!sruRegistrationOpen) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Registration for SR University students using an @sru.edu.in email address is currently closed.',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 403 }
      );
    }
  } else {
    if (!externalRegistrationOpen) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Registration for external participants is currently closed. Payment cannot be initiated.',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 403 }
      );
    }
  }

  try {
    const transactionRef = `SRU-PG-${Date.now()}`;

    return new Response(
      JSON.stringify({
        success: true,
        transactionRef,
        amountINR: body.amountINR || body.payload?.amountINR || (isSRU ? 0 : 1000),
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
