"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, FlaskConical, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step={label:string;status:"idle"|"running"|"pass"|"fail";detail?:string};

const initialSteps:Step[]=[
  {label:"التحقق من صلاحية مدير المنصة",status:"idle"},
  {label:"الدخول إلى جلسة DEMO26",status:"idle"},
  {label:"حفظ 50 استجابة + البصمة",status:"idle"},
  {label:"اختيار منتج فعّال",status:"idle"},
  {label:"اجتياز L1",status:"idle"},
  {label:"اجتياز L2",status:"idle"},
  {label:"اجتياز L3 وإكمال المنتج",status:"idle"},
  {label:"استعادة الرحلة من الخادم",status:"idle"},
  {label:"اعتماد التأهيل عبر RLS",status:"idle"},
  {label:"التحقق من الحالة النهائية",status:"idle"}
];

export default function WorkshopAcceptance(){
  const supabase=useMemo(()=>getSupabaseBrowserClient(),[]);
  const [steps,setSteps]=useState<Step[]>(initialSteps);
  const [running,setRunning]=useState(false);
  const [authorized,setAuthorized]=useState<boolean|null>(null);
  const [summary,setSummary]=useState("");
  const [participantId,setParticipantId]=useState<string|null>(null);

  useEffect(()=>{void verify()},[]);

  async function verify(){
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user){setAuthorized(false);return}
    const {data:p}=await supabase.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
    setAuthorized(["platform_admin","admin"].includes(p?.role??""));
  }

  function mark(i:number,status:Step["status"],detail?:string){
    setSteps(prev=>prev.map((s,idx)=>idx===i?{...s,status,detail}:s));
  }

  async function api(action:string,payload:any={}){
    const {data,error}=await supabase.functions.invoke("workshop-public",{body:{action,...payload}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }

  async function run(){
    setRunning(true);setSummary("");setParticipantId(null);setSteps(initialSteps);
    try{
      mark(0,"running");
      const {data:{session}}=await supabase.auth.getSession();
      const {data:p}=await supabase.from("profiles").select("role").eq("id",session?.user?.id??"").maybeSingle();
      if(!session?.user||!["platform_admin","admin"].includes(p?.role??"")) throw new Error("admin_required");
      mark(0,"pass","صلاحية مدير المنصة مؤكدة");

      mark(1,"running");
      const joined=await api("join",{code:"DEMO26",full_name:"__E2E_ACCEPTANCE__",organization_name:"T7IQ Acceptance"});
      const token=joined.participant.participant_token as string;
      const pid=joined.participant.id as string;
      setParticipantId(pid);
      mark(1,"pass","تم إنشاء مشارك اختبار جديد");

      mark(2,"running");
      await api("save_responses",{participant_token:token,answers:Array.from({length:50},(_,i)=>({item_id:i+1,score:3}))});
      await api("save_fingerprint",{participant_token:token,fingerprint_code:"VOT",primary_code:"V",secondary_codes:["O","T"],dimension_scores:{V:{score:40,mean:4},O:{score:35,mean:3.5},T:{score:30,mean:3}}});
      mark(2,"pass","تم حفظ الاستجابات والبصمة");

      mark(3,"running");
      const {data:products}=await supabase.from("product_catalog").select("product_id,product_name").eq("active",true).limit(1);
      const product=products?.[0];
      if(!product) throw new Error("no_active_product");
      const selected=await api("select_product",{participant_token:token,product_id:product.product_id});
      const participantProductId=selected.participant_product.id as string;
      mark(3,"pass",product.product_name||product.product_id);

      for(const level of [1,2,3]){
        const idx=3+level;
        mark(idx,"running");
        const rub=await api("rubric",{participant_token:token,product_id:product.product_id,level_no:level});
        const rubric=Array.isArray(rub.rubric)?rub.rubric:[];
        if(!rubric.length) throw new Error("rubric_empty_L"+level);
        const res=await api("submit_evaluation",{
          participant_token:token,
          participant_product_id:participantProductId,
          level_no:level,
          evaluator_type:"self",
          evaluator_name:"Acceptance Test",
          development_priority:"اختبار آلي",
          next_recommendation:level<3?"الانتقال للمستوى التالي":"إغلاق الرحلة",
          scores:rubric.map((r:any)=>({rubric_template_id:r.id,score:Number(r.max_score??6)})),
          notes:[]
        });
        if(!res.passed) throw new Error("level_failed_L"+level);
        if(level===3&&res.status!=="completed") throw new Error("L3_not_completed");
        mark(idx,"pass",level===3?"اكتمل المنتج":"تم الانتقال للمستوى التالي");
      }

      mark(7,"running");
      const resumed=await api("resume",{participant_token:token});
      if(resumed.participant_product?.status!=="completed") throw new Error("resume_not_completed");
      mark(7,"pass","البيانات مستعادة من الخادم");

      mark(8,"running");
      const {error:qualError}=await supabase.from("workshop_participants").update({
        qualification_status:"qualified",
        qualified_at:new Date().toISOString(),
        completed_at:new Date().toISOString()
      }).eq("id",pid);
      if(qualError) throw qualError;
      mark(8,"pass","نجح اعتماد التأهيل تحت سياسات RLS");

      mark(9,"running");
      const {data:final,error:finalError}=await supabase.from("workshop_participants")
        .select("qualification_status,qualified_at,completed_at").eq("id",pid).maybeSingle();
      if(finalError) throw finalError;
      if(final?.qualification_status!=="qualified"||!final.qualified_at||!final.completed_at) throw new Error("final_state_invalid");
      mark(9,"pass","مؤهل + مكتمل + محفوظ");
      setSummary("نجح اختبار Workshop & Qualification v1.0 من الدخول حتى التأهيل.");
    }catch(e){
      const message=e instanceof Error?e.message:"unknown_error";
      setSummary("فشل الاختبار: "+message);
      setSteps(prev=>{
        const i=prev.findIndex(s=>s.status==="running");
        return i<0?prev:prev.map((s,idx)=>idx===i?{...s,status:"fail",detail:message}:s);
      });
    }finally{setRunning(false)}
  }

  async function cleanup(){
    if(!participantId) return;
    await supabase.from("workshop_participants").delete().eq("id",participantId);
    setParticipantId(null);setSummary("تم حذف بيانات اختبار القبول.");
  }

  if(authorized===null) return <main className="roleGate"><div className="roleGateCard"><h1>جارٍ التحقق من الصلاحية</h1></div></main>;
  if(!authorized) return <main className="roleGate"><div className="roleGateCard"><CircleAlert/><h1>اختبار القبول</h1><p>هذه الصفحة متاحة لمدير المنصة فقط.</p><Link className="primaryButton" href="/login">تسجيل الدخول</Link></div></main>;

  const passed=steps.filter(s=>s.status==="pass").length;
  return <main className="roleWorkspace acceptancePage">
    <header className="roleHero">
      <div className="roleBrand"><div className="differenceMark"><span>ت</span></div><div><span className="sectionKicker">Production Acceptance</span><h1>اختبار قبول الجزء الأول</h1><p>اختبار آلي لمسار الورشة من الدخول وحتى اعتماد التأهيل.</p></div></div>
      <div className="roleHeroActions"><Link href="/admin/training" className="outlineButton"><ArrowRight/> مركز الورشة</Link><button className="primaryButton" disabled={running} onClick={()=>void run()}>{running?<RefreshCw className="spin"/>:<Play/>} {running?"جارٍ الاختبار":"تشغيل الاختبار"}</button></div>
    </header>

    <section className="acceptanceSummary">
      <div><ShieldCheck/><strong>{passed}/{steps.length}</strong><span>اختبارات ناجحة</span></div>
      <div><FlaskConical/><strong>{running?"يعمل":passed===steps.length?"جاهز":"بانتظار"}</strong><span>حالة القبول</span></div>
    </section>

    <section className="acceptanceSteps">
      {steps.map((s,i)=><article key={s.label} className={s.status}>
        <i>{s.status==="pass"?<CheckCircle2/>:s.status==="fail"?<CircleAlert/>:<span>{i+1}</span>}</i>
        <div><b>{s.label}</b>{s.detail&&<small>{s.detail}</small>}</div>
      </article>)}
    </section>

    {summary&&<div className={"acceptanceResult "+(passed===steps.length?"pass":"")}>{summary}</div>}
    {participantId&&<div className="acceptanceActions"><button className="outlineButton" onClick={()=>void cleanup()}>حذف بيانات الاختبار</button></div>}
  </main>
}
