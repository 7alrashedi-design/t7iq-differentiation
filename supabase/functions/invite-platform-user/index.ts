import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role,organization_id")
      .eq("id", caller.id)
      .maybeSingle();

    const callerRole = callerProfile?.role;
    const isPlatformAdmin = callerRole === "platform_admin" || callerRole === "admin";
    const isSchoolAdmin = callerRole === "school_admin";
    if (!isPlatformAdmin && !isSchoolAdmin) return Response.json({ error: "forbidden" }, { status: 403, headers: corsHeaders });

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const role = String(body.role ?? "teacher");
    const requestedOrg = body.organization_id ? String(body.organization_id) : null;

    if (!email || !fullName || !password) {
      return Response.json({ error: "email_name_password_required" }, { status: 400, headers: corsHeaders });
    }
    if (password.length < 8) {
      return Response.json({ error: "password_too_short" }, { status: 400, headers: corsHeaders });
    }

    const allowedRoles = ["platform_admin","school_admin","trainer","teacher","supervisor"];
    if (!allowedRoles.includes(role)) return Response.json({ error: "invalid_role" }, { status: 400, headers: corsHeaders });
    if (role === "platform_admin" && !isPlatformAdmin) return Response.json({ error: "platform_admin_only" }, { status: 403, headers: corsHeaders });

    const organizationId = (role === "platform_admin" || role === "trainer" || role === "supervisor") ? null : isSchoolAdmin ? callerProfile?.organization_id : requestedOrg;
    if ((role === "teacher" || role === "school_admin") && !organizationId) return Response.json({ error: "organization_required" }, { status: 400, headers: corsHeaders });

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role, organization_id: organizationId },
    });

    if (createError) return Response.json({ error: createError.message }, { status: 400, headers: corsHeaders });
    const newUser = created.user;
    if (!newUser) return Response.json({ error: "user_creation_failed" }, { status: 500, headers: corsHeaders });

    const { error: profileError } = await admin.from("profiles").upsert({
      id: newUser.id,
      organization_id: organizationId,
      role,
      full_name: fullName,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(newUser.id);
      return Response.json({ error: profileError.message }, { status: 400, headers: corsHeaders });
    }

    return Response.json({ ok: true, user_id: newUser.id, email, role, organization_id: organizationId }, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500, headers: corsHeaders });
  }
});
