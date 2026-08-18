import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateJudgePayload {
  name?: string;
  email?: string;
  department?: string;
  temporaryPassword?: string;
  isActive?: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Only POST is accepted." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[create-judge] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing credentials." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Privileged Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ─── 1. AUTHORIZATION: Verify Caller is Admin ─────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);

    if (callerError || !callerData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired administrator session." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerUser = callerData.user;

    // Query public.user_roles strictly by user_id UUID using maybeSingle
    const { data: roleRow, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .maybeSingle();

    if (roleCheckError) {
      console.warn("[create-judge] Role check query notice:", roleCheckError.message);
    }

    const callerRole = (roleRow?.role || "").toLowerCase();
    const metaRole = String(callerUser.user_metadata?.role || "").toLowerCase();

    const isAdmin =
      callerRole === "admin" ||
      callerRole === "superadmin" ||
      metaRole === "admin" ||
      metaRole === "superadmin";

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Administrator privileges required to create judge accounts." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── 2. VALIDATION: Parse & Validate Payload ──────────────────────────────
    let body: CreateJudgePayload;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const department = body.department?.trim() || "";
    const temporaryPassword = body.temporaryPassword?.trim();
    const isActive = body.isActive ?? true;

    if (!name) {
      return new Response(
        JSON.stringify({ error: "Full Name is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!temporaryPassword || temporaryPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Temporary password must be at least 6 characters long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── 3. CREATE AUTH USER ──────────────────────────────────────────────────
    const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name,
        display_name: name,
        role: "judge",
        department,
      },
    });

    if (authError) {
      console.error("[create-judge] Auth creation error:", authError.message);
      let clientMsg = authError.message;
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        clientMsg = "An account with this email already exists.";
      }
      return new Response(
        JSON.stringify({ error: clientMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdAuthUser = authResult.user;
    if (!createdAuthUser || !createdAuthUser.id) {
      return new Response(
        JSON.stringify({ error: "Failed to create judge authentication record." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── 4. INSERT USER_ROLES ─────────────────────────────────────────────────
    const { error: userRoleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: createdAuthUser.id,
          role: "judge",
        },
        { onConflict: "user_id" }
      );

    if (userRoleError) {
      console.error("[create-judge] user_roles insert error, rolling back auth user:", userRoleError.message);
      // Rollback Auth user
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUser.id);
      return new Response(
        JSON.stringify({ error: `Failed to assign judge role: ${userRoleError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── 5. INSERT JUDGES TABLE (Profile) ─────────────────────────────────────
    const judgeProfilePayload = {
      user_id: createdAuthUser.id,
      name,
      email,
      department,
      is_active: isActive,
    };

    const { data: judgeRow, error: judgeInsertError } = await supabaseAdmin
      .from("judges")
      .insert([judgeProfilePayload])
      .select()
      .single();

    if (judgeInsertError) {
      console.error("[create-judge] judges table insert error, rolling back:", judgeInsertError.message);
      // Rollback user_roles and Auth user
      await supabaseAdmin.from("user_roles").delete().eq("user_id", createdAuthUser.id);
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUser.id);

      return new Response(
        JSON.stringify({ error: `Failed to create judge profile: ${judgeInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── 6. SUCCESS RESPONSE (NEVER RETURN PASSWORD) ──────────────────────────
    const createdJudge = {
      id: String(judgeRow?.id || createdAuthUser.id),
      user_id: createdAuthUser.id,
      name: judgeRow?.name || name,
      email: judgeRow?.email || email,
      department: judgeRow?.department || department,
      isActive: judgeRow?.is_active ?? isActive,
      evaluationsCompleted: 0,
      createdAt: judgeRow?.created_at || new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        judge: createdJudge,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[create-judge] Unhandled exception:", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected server error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
