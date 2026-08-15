/**
 * Supabase Edge Function: send-registration-confirmation
 * PRAGATHI 2K26 — National Level Project Expo
 *
 * Authoritative, server-side registration confirmation email sender.
 *
 * Flow:
 * 1. Receives { registrationId, memberId, forceResend }
 * 2. Queries Supabase database authoritatively (registrations, team_members, projects, institutions, site_settings)
 * 3. Identifies Team Leader vs Team Members from database
 * 4. Deduplicates against registration_email_logs (prevents duplicate sending if already sent)
 * 5. Builds personalized, cross-client responsive HTML emails
 * 6. Sends via transactional provider (Resend API) using RESEND_API_KEY secret
 * 7. Records status (pending/sent/failed) in registration_email_logs
 * 8. Never crashes; returns structured delivery summary
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Official Configuration
const OFFICIAL_SENDER = Deno.env.get('RESEND_FROM_EMAIL') || Deno.env.get('SENDER_EMAIL') || 'PRAGATHI 2K26 <onboarding@resend.dev>';
const OFFICIAL_REPLY_TO = 'sruprojectexpo@gmail.com';
const OFFICIAL_SUPPORT_EMAIL = 'dean.psc@sru.edu.in';
const OFFICIAL_HELPLINE = '+91 9514418276';
const OFFICIAL_HELPLINE_TEL = '+919514418276';

const OFFICIAL_SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/in/sru-pragathi-73a876429/',
  facebook: 'https://www.facebook.com/share/19D3TK5Yae/',
  instagram: 'https://www.instagram.com/sru.pragathi2.0?igsh=dng0ZXR2Y2g2enU1',
};

interface EmailPayload {
  registrationId?: string; // Human readable (PRAGATHI26-XXXXXX) or UUID
  memberId?: string; // Optional specific member UUID
  forceResend?: boolean; // For admin retry
}

interface ParticipantRecipient {
  memberId: string | null;
  name: string;
  email: string;
  role: 'Leader' | 'Member';
  isLeader: boolean;
}

/**
 * Generates responsive, clean, professional HTML email
 */
function buildConfirmationEmailHtml(params: {
  participantName: string;
  participantEmail: string;
  registrationId: string;
  teamName: string;
  projectTitle: string;
  institution: string;
  role: 'Leader' | 'Member';
  isLeader: boolean;
  loginUrl: string;
}): string {
  const {
    participantName,
    participantEmail,
    registrationId,
    teamName,
    projectTitle,
    institution,
    role,
    isLeader,
    loginUrl,
  } = params;

  const roleDisplay = isLeader ? 'Team Leader' : 'Team Member';

  // Team Leader Specific Section
  const leaderActionSection = isLeader
    ? `
      <!-- TEAM LEADER ACTION REQUIRED -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: #f0f7ff; border: 1.5px solid #b9d9eb; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="padding: 18px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #004182;">
                  ★ TEAM LEADER ACTION REQUIRED
                </td>
              </tr>
              <tr>
                <td style="padding-top: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
                  As the <strong>Team Leader</strong>, you can submit and edit your project poster from your Participant Profile.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #334155;">
                  Sign in using your registered email and Registration ID and open:
                  <div style="margin-top: 6px; padding: 8px 12px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 12px; font-weight: bold; color: #004182;">
                    Participant Profile &rarr; Project Poster &rarr; Submit / Edit Poster
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b;">
                  Please submit your project poster before the announced deadline.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRAGATHI 2K26 — Registration Confirmed</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f1f5f9;">

  <center>
    <!-- Container Table -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
      
      <!-- Top Brand Header Banner -->
      <tr>
        <td style="background-color: #004182; padding: 32px 28px 28px 28px; text-align: center; color: #ffffff;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center;">
                <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px;">
                  SR University &bull; Warangal
                </span>
                <h1 style="margin: 12px 0 4px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #ffffff; text-transform: uppercase;">
                  PRAGATHI 2K26
                </h1>
                <p style="margin: 0; font-size: 13px; color: #cbd5e1; font-weight: 500;">
                  National Level Project Expo &bull; 09 October 2026
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Sub Header Badge -->
      <tr>
        <td style="background-color: #059669; padding: 10px 24px; text-align: center;">
          <span style="color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 0.04em;">
            &#10003; Registration Confirmed!
          </span>
        </td>
      </tr>

      <!-- Main Body Content -->
      <tr>
        <td style="padding: 32px 28px 24px 28px;">
          
          <!-- Greeting -->
          <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
            Dear ${participantName},
          </p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">
            Your registration for <strong>PRAGATHI 2K26</strong> has been successfully confirmed.
          </p>

          <!-- REGISTRATION DETAILS BOX -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
            <tr>
              <td colspan="2" style="background-color: #f1f5f9; padding: 10px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; border-bottom: 1px solid #e2e8f0;">
                REGISTRATION DETAILS
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; width: 35%; border-bottom: 1px solid #f1f5f9;">Registration ID:</td>
              <td style="padding: 12px 16px; font-size: 14px; font-family: monospace; font-weight: 800; color: #004182; border-bottom: 1px solid #f1f5f9;">${registrationId}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Team Name:</td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${teamName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Project Title:</td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${projectTitle}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Institution:</td>
              <td style="padding: 12px 16px; font-size: 13px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${institution}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600;">Your Role:</td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #004182;">${roleDisplay}</td>
            </tr>
          </table>

          <!-- LOGIN TO YOUR PARTICIPANT PROFILE -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1.5px solid #004182; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
            <tr>
              <td style="background-color: #004182; padding: 10px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #ffffff;">
                LOGIN TO YOUR PARTICIPANT PROFILE
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 20px;">
                <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #334155;">
                  You can access your Participant Profile using your registered email address and Registration ID.
                </p>
                <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; margin-bottom: 16px;">
                  <div style="margin-bottom: 6px;"><strong>Registered Email:</strong> <span style="color: #0f172a;">${participantEmail}</span></div>
                  <div><strong>Registration ID:</strong> <span style="font-family: monospace; font-weight: 700; color: #004182;">${registrationId}</span></div>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 8px 0 12px 0;">
                  <tr>
                    <td style="background-color: #004182; border-radius: 8px; text-align: center;">
                      <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px;">
                        Sign In to Participant Profile &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  <strong>Important:</strong> Keep your Registration ID safe. You will need it along with your registered email address to sign in.
                </p>
              </td>
            </tr>
          </table>

          ${leaderActionSection}

          <!-- NEED HELP? — CONTACT SUPPORT -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="background-color: #f1f5f9; padding: 10px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; border-bottom: 1px solid #e2e8f0;">
                NEED HELP? — CONTACT SUPPORT
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 20px;">
                <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #334155;">
                  For registration-related queries or event assistance, contact the PRAGATHI 2K26 support team:
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding-bottom: 8px; color: #64748b; font-weight: 600; width: 35%;">Support Email:</td>
                    <td style="padding-bottom: 8px;">
                      <a href="mailto:${OFFICIAL_SUPPORT_EMAIL}" style="color: #004182; font-weight: 700; text-decoration: underline;">
                        ${OFFICIAL_SUPPORT_EMAIL}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-weight: 600;">Helpline:</td>
                    <td>
                      <a href="tel:${OFFICIAL_HELPLINE_TEL}" style="color: #004182; font-weight: 700; text-decoration: underline;">
                        ${OFFICIAL_HELPLINE}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- FOLLOW US FOR UPDATES -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; text-align: center;">
            <tr>
              <td style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; padding-bottom: 8px;">
                FOLLOW US FOR UPDATES
              </td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #64748b; line-height: 1.5; padding-bottom: 12px;">
                Follow our official social channels for event announcements, updates, highlights, and important information.
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" align="center" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 0 8px;">
                      <a href="${OFFICIAL_SOCIAL_LINKS.linkedin}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #0077b5; color: #ffffff; font-size: 12px; font-weight: 700; text-decoration: none; border-radius: 6px;">
                        LinkedIn
                      </a>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="${OFFICIAL_SOCIAL_LINKS.facebook}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #1877f2; color: #ffffff; font-size: 12px; font-weight: 700; text-decoration: none; border-radius: 6px;">
                        Facebook
                      </a>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="${OFFICIAL_SOCIAL_LINKS.instagram}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #e1306c; color: #ffffff; font-size: 12px; font-weight: 700; text-decoration: none; border-radius: 6px;">
                        Instagram
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f8fafc; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #004182;">
            PRAGATHI 2K26 &bull; SR University
          </p>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b;">
            Thank you for participating in PRAGATHI 2K26!
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            This is an automated notification from the PRAGATHI 2K26 Secretariat. Please do not reply directly to this email. For support, use dean.psc@sru.edu.in.
          </p>
        </td>
      </tr>

    </table>
  </center>

</body>
</html>`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const publicSiteUrl = Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('APP_URL') || 'https://pragathi2k26.sru.edu.in';

    // Normalize public URL
    const cleanSiteUrl = publicSiteUrl.endsWith('/') ? publicSiteUrl.slice(0, -1) : publicSiteUrl;
    const loginUrl = `${cleanSiteUrl}/login`;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Edge Function] Missing SUPABASE_URL or keys');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase configuration missing in Edge Function environment.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: EmailPayload = await req.json().catch(() => ({}));
    const targetRegId = (body.registrationId || '').trim();
    const targetMemberId = body.memberId;
    const forceResend = Boolean(body.forceResend);

    if (!targetRegId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: registrationId',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 1. Authoritatively fetch registration from Supabase
    let regQuery = supabase
      .from('registrations')
      .select('*, institutions(*), team_members(*), projects(*)');

    if (targetRegId.length === 36 && targetRegId.includes('-')) {
      regQuery = regQuery.or(`id.eq.${targetRegId},registration_id.eq.${targetRegId}`);
    } else {
      regQuery = regQuery.eq('registration_id', targetRegId);
    }

    const { data: regRows, error: regFetchError } = await regQuery.limit(1);

    if (regFetchError || !regRows || regRows.length === 0) {
      console.error('[Edge Function] Registration not found for:', targetRegId, regFetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Registration '${targetRegId}' was not found in database.`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const reg = regRows[0];
    const registrationUUID = reg.id;
    const registrationCode = reg.registration_id;
    const teamName = reg.team_name || 'PRAGATHI 2K26 Team';

    const projectObj = Array.isArray(reg.projects) ? reg.projects[0] : reg.projects;
    const projectTitle = projectObj?.title || 'PRAGATHI 2K26 Expo Project';

    const instObj = Array.isArray(reg.institutions) ? reg.institutions[0] : reg.institutions;
    const institutionName = instObj?.name || 'SR University, Warangal';

    // 2. Resolve Recipients authoritatively from team_members / leader
    const rawMembers: any[] = reg.team_members || [];
    const recipients: ParticipantRecipient[] = [];

    if (rawMembers && rawMembers.length > 0) {
      for (const m of rawMembers) {
        const isLeader = Boolean(m.is_team_leader);
        recipients.push({
          memberId: m.id || null,
          name: m.name || (isLeader ? reg.leader_name : 'Participant'),
          email: (m.email || '').trim().toLowerCase(),
          role: isLeader ? 'Leader' : 'Member',
          isLeader,
        });
      }
    } else {
      // Fallback: create recipient from leader fields
      recipients.push({
        memberId: null,
        name: reg.leader_name || 'Team Leader',
        email: (reg.leader_email || '').trim().toLowerCase(),
        role: 'Leader',
        isLeader: true,
      });
    }

    // Filter by memberId if requested
    const filteredRecipients = targetMemberId
      ? recipients.filter((r) => r.memberId === targetMemberId || r.email === targetMemberId)
      : recipients;

    if (filteredRecipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid recipient email records found for registration.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 3. Process each recipient with deduplication & logging
    const deliveryResults: Array<{
      email: string;
      role: string;
      status: 'sent' | 'skipped' | 'failed';
      messageId?: string;
      error?: string;
    }> = [];

    const subject = `PRAGATHI 2K26 — Registration Confirmed | ${registrationCode}`;

    for (const recipient of filteredRecipients) {
      if (!recipient.email || !recipient.email.includes('@')) {
        deliveryResults.push({
          email: recipient.email,
          role: recipient.role,
          status: 'failed',
          error: 'Invalid recipient email address format',
        });
        continue;
      }

      // Check existing email logs for deduplication
      if (!forceResend) {
        const { data: existingLog } = await supabase
          .from('registration_email_logs')
          .select('id, status')
          .eq('registration_id', registrationUUID)
          .eq('recipient_email', recipient.email)
          .eq('status', 'sent')
          .limit(1);

        if (existingLog && existingLog.length > 0) {
          console.log(`[Edge Function] Duplicate skipped: confirmation already sent to ${recipient.email}`);
          deliveryResults.push({
            email: recipient.email,
            role: recipient.role,
            status: 'skipped',
            error: 'Confirmation email already sent successfully (duplicate prevented).',
          });
          continue;
        }
      }

      // Generate HTML email content
      const htmlBody = buildConfirmationEmailHtml({
        participantName: recipient.name,
        participantEmail: recipient.email,
        registrationId: registrationCode,
        teamName,
        projectTitle,
        institution: institutionName,
        role: recipient.role,
        isLeader: recipient.isLeader,
        loginUrl,
      });

      // Insert pending log entry
      let logId: string | null = null;
      try {
        const { data: logInsert } = await supabase
          .from('registration_email_logs')
          .insert([
            {
              registration_id: registrationUUID,
              registration_code: registrationCode,
              member_id: recipient.memberId,
              recipient_name: recipient.name,
              recipient_email: recipient.email,
              recipient_role: recipient.role,
              email_type: 'registration_confirmation',
              subject,
              status: 'pending',
              provider: 'resend',
            },
          ])
          .select('id')
          .single();

        if (logInsert?.id) {
          logId = logInsert.id;
        }
      } catch (logErr) {
        console.warn('[Edge Function] Failed to create initial pending email log:', logErr);
      }

      // 4. Send via Transactional Email Provider (Resend API)
      if (!resendApiKey) {
        const errMsg = 'RESEND_API_KEY secret is not configured in Edge Function environment.';
        console.warn(`[Edge Function] Warning: ${errMsg}`);

        if (logId) {
          await supabase
            .from('registration_email_logs')
            .update({
              status: 'failed',
              error_message: errMsg,
              updated_at: new Date().toISOString(),
            })
            .eq('id', logId);
        }

        deliveryResults.push({
          email: recipient.email,
          role: recipient.role,
          status: 'failed',
          error: errMsg,
        });
        continue;
      }

      try {
        const resendPayload: Record<string, any> = {
          from: OFFICIAL_SENDER,
          to: [recipient.email],
          subject,
          html: htmlBody,
        };
        if (OFFICIAL_REPLY_TO) {
          resendPayload.reply_to = OFFICIAL_REPLY_TO;
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resendPayload),
        });

        const resendStatus = resendResponse.status;
        const resendData = await resendResponse.json().catch(() => ({}));

        if (resendResponse.ok && resendData.id) {
          console.log(`[EMAIL_SERVICE] Status: ${resendStatus} | Success: true | MessageId: ${resendData.id} | Recipient: ${recipient.email}`);
          if (logId) {
            try {
              await supabase
                .from('registration_email_logs')
                .update({
                  status: 'sent',
                  provider_message_id: resendData.id,
                  sent_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', logId);
            } catch (updateErr) {
              console.warn('[EMAIL_SERVICE] Log update notice:', updateErr);
            }
          }

          deliveryResults.push({
            email: recipient.email,
            role: recipient.role,
            status: 'sent',
            messageId: resendData.id,
          });
        } else {
          const errName = resendData.name || 'ResendDeliveryError';
          const errMsg = resendData.message || resendData.error || `HTTP ${resendStatus}`;
          console.error(`[EMAIL_SERVICE] Status: ${resendStatus} | Success: false | ErrorName: ${errName} | ErrorMessage: ${errMsg} | Recipient: ${recipient.email}`);

          if (logId) {
            try {
              await supabase
                .from('registration_email_logs')
                .update({
                  status: 'failed',
                  error_message: `[${resendStatus}] ${errName}: ${errMsg}`,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', logId);
            } catch (updateErr) {
              console.warn('[EMAIL_SERVICE] Log update notice:', updateErr);
            }
          }

          deliveryResults.push({
            email: recipient.email,
            role: recipient.role,
            status: 'failed',
            error: errMsg,
          });
        }
      } catch (sendErr: any) {
        const errMsg = sendErr?.message || 'Network exception during Resend API call';
        console.error(`[EMAIL_SERVICE] Network Error: ${errMsg} | Recipient: ${recipient.email}`);
        if (logId) {
          try {
            await supabase
              .from('registration_email_logs')
              .update({
                status: 'failed',
                error_message: errMsg,
                updated_at: new Date().toISOString(),
              })
              .eq('id', logId);
          } catch (updateErr) {
            console.warn('[EMAIL_SERVICE] Log update notice:', updateErr);
          }
        }

        deliveryResults.push({
          email: recipient.email,
          role: recipient.role,
          status: 'failed',
          error: errMsg,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        registrationId: registrationCode,
        totalRecipients: filteredRecipients.length,
        results: deliveryResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    console.error('[Edge Function] Unexpected top-level error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Unexpected internal server error in Edge Function',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
