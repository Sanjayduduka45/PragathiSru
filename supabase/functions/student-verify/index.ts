/**
 * Supabase Edge Function: Student Verification Placeholder
 * PRAGATHI 2K26 - SR University
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
    const { email, rollNumber } = await req.json();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail.endsWith('@sru.edu.in')) {
      return new Response(
        JSON.stringify({
          success: false,
          isVerified: false,
          message: 'Email must belong to @sru.edu.in domain.',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        isVerified: true,
        message: 'SR University student verified via edge function.',
        rollNumber,
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
