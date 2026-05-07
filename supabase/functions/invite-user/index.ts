import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-user-id, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  try {
    const { email, name, role, crm_crn, redirectTo } = await req.json();

    if (!email || !name || !role) throw new Error("Missing invite fields");
    if (!["NUTRITIONIST", "PATIENT"].includes(role)) throw new Error("Invalid invite role");
    if (role === "NUTRITIONIST" && !crm_crn) throw new Error("CRM/CRN is required");

    // 1. Get caller info
    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabaseClient
      .from("profiles")
      .select("role, clinic_id")
      .eq("id", user.id)
      .single();

    if (!callerProfile) throw new Error("Caller profile not found");
    if (!callerProfile.clinic_id) throw new Error("Caller is not linked to a clinic");

    // 2. Validate hierarchy
    if (callerProfile.role === "ADMIN" && role !== "NUTRITIONIST") throw new Error("Invalid hierarchy");
    if (callerProfile.role === "NUTRITIONIST" && role !== "PATIENT") throw new Error("Invalid hierarchy");
    if (callerProfile.role === "PATIENT") throw new Error("Patients cannot invite anyone");
    if (!["ADMIN", "NUTRITIONIST"].includes(callerProfile.role)) throw new Error("Invalid caller role");

    const requestOrigin = req.headers.get("Origin");
    const inviteRedirectTo =
      typeof redirectTo === "string" && redirectTo.length > 0
        ? redirectTo
        : requestOrigin
          ? `${requestOrigin}/accept-invite`
          : undefined;

    // 3. Invite User to Auth
    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name },
      redirectTo: inviteRedirectTo,
    });
    if (inviteErr) throw inviteErr;

    const newUserId = inviteData.user.id;

    // 4. Update Profile (Upsert to avoid conflict with DB trigger)
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      name,
      role,
      clinic_id: callerProfile.clinic_id
    });
    if (profileErr) throw profileErr;

    // 5. Create Role Details
    if (role === "NUTRITIONIST") {
      const { error: nutriErr } = await supabaseAdmin.from("nutritionist_details").insert({
        id: newUserId,
        crm_crn,
        status: "PENDING",
        clinic_id: callerProfile.clinic_id
      });
      if (nutriErr) throw nutriErr;
    } else if (role === "PATIENT") {
      const { error: patientErr } = await supabaseAdmin.from("patient_details").insert({
        id: newUserId,
        nutritionist_id: user.id,
        clinic_id: callerProfile.clinic_id
      });
      if (patientErr) throw patientErr;
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
