import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, serviceRole);

  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "session") {
      const code = String(body.code ?? "").trim().toUpperCase();
      const { data, error } = await db.from("workshop_sessions")
        .select("id,title,session_code,status,trainer_names,venue,starts_at,ends_at,settings")
        .eq("session_code", code).in("status", ["open","live"]).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "session_not_found" }, 404);
      return json({ session: data });
    }

    if (action === "demo_summary") {
      const code = String(body.code ?? "DEMO26").trim().toUpperCase();
      const { data: demoSession } = await db.from("workshop_sessions")
        .select("id,title,session_code,status,trainer_names,settings")
        .eq("session_code", code).maybeSingle();
      if (!demoSession || demoSession.settings?.test_mode !== true) {
        return json({ error: "demo_not_found" }, 404);
      }
      const { data: participants } = await db.from("workshop_participants")
        .select("id,joined_at,completed_at").eq("session_id", demoSession.id);
      const ids = (participants ?? []).map((p:any)=>p.id);
      const [{ data: fps }, { data: pps }, { data: apps }] = await Promise.all([
        ids.length ? db.from("fingerprint_results").select("participant_id,fingerprint_code,primary_code").in("participant_id", ids) : Promise.resolve({ data: [] }),
        ids.length ? db.from("participant_products").select("participant_id,product_id,current_level,status").in("participant_id", ids) : Promise.resolve({ data: [] }),
        ids.length ? db.from("workshop_applications").select("participant_id,status").in("participant_id", ids) : Promise.resolve({ data: [] }),
      ]);
      const dist: Record<string,number> = { W:0,O:0,V:0,T:0,K:0 };
      for (const fp of fps ?? []) {
        const raw = String((fp as any).primary_code ?? "").toUpperCase();
        const key = raw.startsWith("K") ? "K" : raw;
        if (key in dist) dist[key] += 1;
      }
      const levels = { L1:0,L2:0,L3:0,completed:0 };
      for (const pp of pps ?? []) {
        if ((pp as any).status === "completed") levels.completed += 1;
        else if ((pp as any).current_level === 1) levels.L1 += 1;
        else if ((pp as any).current_level === 2) levels.L2 += 1;
        else if ((pp as any).current_level === 3) levels.L3 += 1;
      }
      return json({
        session: demoSession,
        totals: {
          participants: ids.length,
          fingerprints: (fps ?? []).length,
          products: (pps ?? []).length,
          applications: (apps ?? []).length,
          completed: (participants ?? []).filter((p:any)=>p.completed_at).length
        },
        distribution: dist,
        levels
      });
    }

    if (action === "join") {
      const code = String(body.code ?? "").trim().toUpperCase();
      const fullName = String(body.full_name ?? "").trim();
      const organizationName = String(body.organization_name ?? "").trim();
      if (!code || !fullName) return json({ error: "name_and_code_required" }, 400);

      const { data: session } = await db.from("workshop_sessions")
        .select("id,title,session_code,status,trainer_names,settings")
        .eq("session_code", code).in("status", ["open","live"]).maybeSingle();
      if (!session) return json({ error: "session_not_found" }, 404);

      const { data: participant, error } = await db.from("workshop_participants")
        .insert({
          session_id: session.id,
          full_name: fullName,
          organization_name: organizationName || null,
          email: body.email ? String(body.email).trim().toLowerCase() : null,
          mobile: body.mobile ? String(body.mobile).trim() : null
        }).select("id,participant_token,full_name,organization_name").single();
      if (error) throw error;
      return json({ session, participant });
    }

    const token = String(body.participant_token ?? "").trim();
    if (!token) return json({ error: "participant_token_required" }, 401);

    const { data: participant } = await db.from("workshop_participants")
      .select("id,session_id,full_name,organization_name,email,mobile")
      .eq("participant_token", token).maybeSingle();
    if (!participant) return json({ error: "invalid_participant" }, 401);

    if (action === "save_responses") {
      const answers = Array.isArray(body.answers) ? body.answers : [];
      const rows = answers.map((a: any) => ({
        participant_id: participant.id,
        item_id: Number(a.item_id),
        score: Number(a.score),
        answered_at: new Date().toISOString(),
      }));
      const { error } = await db.from("style_scale_responses").upsert(rows, { onConflict: "participant_id,item_id" });
      if (error) throw error;
      return json({ ok: true, saved: rows.length });
    }

    if (action === "save_fingerprint") {
      const { data, error } = await db.from("fingerprint_results").upsert({
        participant_id: participant.id,
        fingerprint_code: String(body.fingerprint_code ?? ""),
        primary_code: String(body.primary_code ?? ""),
        secondary_codes: Array.isArray(body.secondary_codes) ? body.secondary_codes : [],
        dimension_scores: body.dimension_scores ?? {},
        generated_at: new Date().toISOString()
      }, { onConflict: "participant_id" }).select("*").single();
      if (error) throw error;
      return json({ result: data });
    }

    if (action === "select_product") {
      const productId = String(body.product_id ?? "");
      const { data: product } = await db.from("product_catalog")
        .select("product_id,product_name,style_category,style_code")
        .eq("product_id", productId).eq("active", true).maybeSingle();
      if (!product) return json({ error: "product_not_found" }, 404);

      const { data, error } = await db.from("participant_products").upsert({
        participant_id: participant.id, product_id: productId, current_level: 1, status: "in_progress"
      }, { onConflict: "participant_id,product_id" })
        .select("id,product_id,current_level,status").single();
      if (error) throw error;
      return json({ participant_product: data, product });
    }

    if (action === "rubric") {
      const level = Number(body.level_no ?? 1);
      const productId = body.product_id ? String(body.product_id) : null;
      let rubricQuery = db.from("product_rubric_templates")
        .select("id,level_no,section,subsection,criterion_key,criterion_template,essential,min_score,max_score,sort_order,product_id")
        .eq("level_no", level);
      if (productId) rubricQuery = rubricQuery.or(`product_id.eq.${productId},product_id.is.null`);
      const { data, error } = await rubricQuery.order("product_id",{ascending:false,nullsFirst:false}).order("sort_order");
      if (error) throw error;
      const specificRows = productId ? (data ?? []).filter((r:any)=>r.product_id===productId) : [];
      const rubricRows = specificRows.length ? specificRows : (data ?? []).filter((r:any)=>!r.product_id);
      return json({ rubric: rubricRows });
    }

    if (action === "submit_evaluation") {
      const participantProductId = String(body.participant_product_id ?? "");
      const level = Number(body.level_no ?? 1);
      const scores = Array.isArray(body.scores) ? body.scores : [];

      const { data: pp } = await db.from("participant_products")
        .select("id,participant_id,current_level,status,product_id")
        .eq("id", participantProductId).eq("participant_id", participant.id).maybeSingle();
      if (!pp) return json({ error: "product_selection_not_found" }, 404);
      if (level !== pp.current_level) return json({ error: "invalid_level" }, 400);

      const { data: rubric } = await db.from("product_rubric_templates")
        .select("id,essential,min_score,product_id")
        .eq("level_no", level)
        .or(`product_id.eq.${pp.product_id},product_id.is.null`)
        .order("product_id",{ascending:false,nullsFirst:false});
      const specificRows = (rubric ?? []).filter((r:any)=>r.product_id===pp.product_id);
      const rubricRows = specificRows.length ? specificRows : (rubric ?? []).filter((r:any)=>!r.product_id);
      const allowed = new Set(rubricRows.map((r:any)=>r.id));
      const scoreMap = new Map(scores.filter((s:any)=>allowed.has(s.rubric_template_id)).map((s:any)=>[s.rubric_template_id, Number(s.score)]));
      if (scoreMap.size !== rubricRows.length) return json({ error: "all_criteria_required" }, 400);

      const { data: previousAttempt } = await db.from("product_evaluation_attempts")
        .select("id,average_score,created_at").eq("participant_product_id",pp.id).eq("level_no",level)
        .order("created_at",{ascending:false}).limit(1).maybeSingle();

      const values = rubricRows.map((r:any)=>scoreMap.get(r.id) ?? 0);
      const avg = values.reduce((a:number,b:number)=>a+b,0) / values.length;
      const essentialPass = rubricRows.filter((r:any)=>r.essential).every((r:any)=>(scoreMap.get(r.id) ?? 0) >= Number(r.min_score ?? 4));
      const levelThreshold = level===1 ? 4 : level===2 ? 4.5 : 5;
      const passed = avg >= levelThreshold && essentialPass;

      const { data: attempt, error: attemptError } = await db.from("product_evaluation_attempts").insert({
        participant_product_id: pp.id,
        level_no: level,
        evaluator_type: "self",
        evaluator_participant_id: participant.id,
        average_score: Number(avg.toFixed(2)),
        essential_pass: essentialPass,
        passed,
        feedback: body.feedback ? String(body.feedback) : null
      }).select("id,average_score,essential_pass,passed").single();
      if (attemptError) throw attemptError;

      const scoreRows = rubricRows.map((r:any)=>({
        attempt_id: attempt.id,
        rubric_template_id: r.id,
        score: scoreMap.get(r.id) ?? 0
      }));
      const { error: scoreError } = await db.from("product_evaluation_scores").insert(scoreRows);
      if (scoreError) throw scoreError;

      let nextLevel = level;
      let status = "in_progress";
      if (passed) {
        if (level < 3) nextLevel = level + 1;
        else status = "completed";
        await db.from("participant_products").update({ current_level: nextLevel, status }).eq("id", pp.id);
      }

      return json({ attempt, passed, average_score: Number(avg.toFixed(2)), essential_pass: essentialPass, required_average: levelThreshold, next_level: nextLevel, status, previous_average: previousAttempt?.average_score ?? null, improvement: previousAttempt ? Number((avg-Number(previousAttempt.average_score)).toFixed(2)) : null });
    }

    if (action === "apply") {
      const { data, error } = await db.from("workshop_applications").upsert({
        participant_id: participant.id,
        interested: body.interested !== false,
        email: body.email ? String(body.email).trim().toLowerCase() : participant.email,
        mobile: body.mobile ? String(body.mobile).trim() : participant.mobile,
        school_name: body.school_name ? String(body.school_name).trim() : participant.organization_name,
        note: body.note ? String(body.note).trim() : null,
        status: "submitted"
      }, { onConflict: "participant_id" }).select("*").single();
      if (error) throw error;
      await db.from("workshop_participants").update({ completed_at: new Date().toISOString() }).eq("id", participant.id);
      return json({ application: data });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});