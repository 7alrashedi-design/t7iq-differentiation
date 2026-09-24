"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Copy, ExternalLink, Plus, QrCode, Radio, Search, UsersRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Session = {
  id:string; program_id:string|null; title:string; session_code:string; status:string; trainer_names:string[];
  venue:string|null; starts_at:string|null; created_at:string; created_by:string|null;
};
type Trainer={id:string;full_name:string|null;email:string|null};
type Assignment={session_id:string;trainer_id:string};
type Program={id:string;title:string;status:string};

export default function WorkshopsAdminPage(){
  const [sessions,setSessions]=useState<Session[]>([]);
  const [profile,setProfile]=useState<{id?:string;role:string;full_name:string|null}|null>(null);
  const [trainersList,setTrainersList]=useState<Trainer[]>([]);
  const [assignments,setAssignments]=useState<Assignment[]>([]);
  const [programs,setPrograms]=useState<Program[]>([]);
  const [programId,setProgramId]=useState("");
  const [title,setTitle]=useState("ورشة التمايز");
  const [trainers,setTrainers]=useState("");
  const [venue,setVenue]=useState("");
  const [startsAt,setStartsAt]=useState("");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [query,setQuery]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");

  useEffect(()=>{void load()},[]);

  async function load(){
    const supabase=getSupabaseBrowserClient();
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user) return;
    const [{data:p},{data:s},{data:t},{data:a},{data:pr}]=await Promise.all([
      supabase.from("profiles").select("id,role,full_name").eq("id",session.user.id).maybeSingle(),
      supabase.from("workshop_sessions")
        .select("id,program_id,title,session_code,status,trainer_names,venue,starts_at,created_at,created_by")
        .order("created_at",{ascending:false}),
      supabase.from("profiles").select("id,full_name,email").eq("role","trainer").order("full_name"),
      supabase.from("workshop_session_trainers").select("session_id,trainer_id"),
      supabase.from("training_programs").select("id,title,status").order("created_at",{ascending:false})
    ]);
    setProfile(p);
    setSessions((s??[]) as Session[]);
    setTrainersList((t??[]) as Trainer[]);
    setAssignments((a??[]) as Assignment[]);
    setPrograms((pr??[]) as Program[]);
  }

  const allowed=useMemo(()=>["platform_admin","admin"].includes(profile?.role??""),[profile]);

  function generateCode(){
    const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s="";
    crypto.getRandomValues(new Uint32Array(6)).forEach(n=>s+=chars[n%chars.length]);
    return s;
  }

  async function create(e:FormEvent){
    e.preventDefault();
    setBusy(true);setNotice("");
    try{
      const supabase=getSupabaseBrowserClient();
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.user) throw new Error("سجّل الدخول أولًا.");
      const code=generateCode();
      const {error}=await supabase.from("workshop_sessions").insert({
        program_id:programId||null,
        title:title.trim(),
        session_code:code,
        status:"open",
        trainer_names:trainers.split(/[,،]/).map(x=>x.trim()).filter(Boolean),
        venue:venue.trim()||null,
        starts_at:startsAt?new Date(startsAt).toISOString():null,
        created_by:session.user.id,
        settings:{
          scale:"asloobi",
          allow_report_download:true,
          allow_share:true,
          product_levels:3,
          pass_average:4,
          essential_min:4,
          qualification_requires_product_completion:true
        }
      });
      if(error) throw error;
      setNotice(`تم إنشاء الجلسة وفتحها للمشاركين. الرمز: ${code}`);
      setVenue("");setStartsAt("");setTrainers("");
      await load();
    }catch(e){
      setNotice(e instanceof Error?e.message:"تعذر إنشاء الجلسة.");
    }finally{setBusy(false)}
  }

  async function assignTrainer(sessionId:string,trainerId:string){
    if(!trainerId) return;
    setBusy(true);setNotice("");
    try{
      const supabase=getSupabaseBrowserClient();
      const {data:{session}}=await supabase.auth.getSession();
      const trainer=trainersList.find(t=>t.id===trainerId);
      const {error}=await supabase.from("workshop_session_trainers").upsert({session_id:sessionId,trainer_id:trainerId,assigned_by:session?.user.id??null});
      if(error) throw error;
      if(trainer?.full_name){
        const current=sessions.find(s=>s.id===sessionId)?.trainer_names??[];
        const names=[...new Set([...current,trainer.full_name])];
        await supabase.from("workshop_sessions").update({trainer_names:names}).eq("id",sessionId);
      }
      setNotice("تم إسناد المدرب للورشة.");
      await load();
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر إسناد المدرب.")}finally{setBusy(false)}
  }

  async function unassignTrainer(sessionId:string,trainerId:string){
    setBusy(true);setNotice("");
    try{
      const supabase=getSupabaseBrowserClient();
      const trainer=trainersList.find(t=>t.id===trainerId);
      const {error}=await supabase.from("workshop_session_trainers").delete().eq("session_id",sessionId).eq("trainer_id",trainerId);
      if(error) throw error;
      if(trainer?.full_name){
        const current=sessions.find(s=>s.id===sessionId)?.trainer_names??[];
        await supabase.from("workshop_sessions").update({trainer_names:current.filter(x=>x!==trainer.full_name)}).eq("id",sessionId);
      }
      setNotice("تم إلغاء إسناد المدرب.");
      await load();
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر إلغاء الإسناد.")}finally{setBusy(false)}
  }

  async function copy(text:string){
    await navigator.clipboard.writeText(text);
    setNotice("تم نسخ الرابط.");
  }

  const programTitle=(id:string|null)=>programs.find(p=>p.id===id)?.title||"ورشة مستقلة";
  const filteredSessions=useMemo(()=>sessions.filter(s=>{
    const q=query.trim().toLowerCase();
    const matchesStatus=statusFilter==="all"||s.status===statusFilter;
    const hay=[s.title,s.session_code,s.venue??"",...(s.trainer_names??[]),programTitle(s.program_id)].join(" ").toLowerCase();
    return matchesStatus&&(!q||hay.includes(q));
  }),[sessions,query,statusFilter,programs]);

  if(!profile) return <main className="adminGate"><div className="adminGateCard refinedGate"><div className="differenceMark"><span>ت</span></div><h1>إدارة الورش</h1><p>يلزم تسجيل الدخول بحساب مدير المنصة.</p><Link href="/login" className="primaryButton">تسجيل الدخول</Link></div></main>;
  if(!allowed) return <main className="adminGate"><div className="adminGateCard refinedGate"><h1>لا توجد صلاحية</h1><p>إنشاء الورش وإسناد المدربين متاح لمدير المنصة فقط.</p><Link href="/" className="outlineButton">العودة</Link></div></main>;

  return <main className="workshopAdminPage">
    <header className="workshopAdminHeader">
      <div className="adminBrandLine">
        <div className="differenceMark small"><span>ت</span></div>
        <div><span className="sectionKicker">منصة التمايز</span><h1>إدارة الورش والجلسات</h1><p>اربط الجلسة بالبرنامج، أسند المدرب، ثم تابع التنفيذ من لوحة واحدة.</p></div>
      </div>
      <div className="adminHeaderActions"><Link href="/admin/training" className="outlineButton">مركز الورشة</Link><Link href="/admin" className="outlineButton">مركز القيادة</Link></div>
    </header>

    {notice&&<div className="adminNotice">{notice}</div>}

    <section className="workshopAdminGrid">
      <article className="premiumCard adminCard createSessionCard">
        <div className="adminCardHead"><div className="iconBadge mint"><Plus size={20}/></div><div><span>جلسة جديدة</span><h2>إنشاء ورشة تدريبية</h2></div></div>
        <form className="adminForm" onSubmit={create}>
          <label>البرنامج التدريبي<select value={programId} onChange={e=>setProgramId(e.target.value)}><option value="">ورشة مستقلة</option>{programs.map(p=><option value={p.id} key={p.id}>{p.title} {p.status==="draft"?"• مسودة":""}</option>)}</select></label>
          <label>اسم الورشة<input required value={title} onChange={e=>setTitle(e.target.value)}/></label>
          <label>اسم المدرب للعرض <small>(اختياري، الإسناد الرسمي بعد الإنشاء)</small><input value={trainers} onChange={e=>setTrainers(e.target.value)} placeholder="اختياري"/></label>
          <label>المكان<input value={venue} onChange={e=>setVenue(e.target.value)} placeholder="اختياري"/></label>
          <label>موعد البداية<input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}/></label>
          <button className="primaryButton" disabled={busy}><Plus size={17}/> إنشاء وفتح الجلسة</button>
        </form>
      </article>

      <article className="premiumCard adminCard sessionGuideCard">
        <div className="adminCardHead"><div className="iconBadge blue"><QrCode size={20}/></div><div><span>رحلة الجلسة</span><h2>من الدخول إلى التأهيل</h2></div></div>
        <div className="sessionGuideSteps">
          <div><span>01</span><b>دخول سريع</b><small>QR + الاسم والجهة</small></div>
          <div><span>02</span><b>أسلوبي</b><small>50 عبارة ثم البصمة</small></div>
          <div><span>03</span><b>المنتج</b><small>L1 → L2 → L3</small></div>
          <div><span>04</span><b>التقرير</b><small>فردي + جماعي</small></div>
          <div><span>05</span><b>التأهيل</b><small>اعتماد المدرب للمتدرب</small></div>
        </div>
      </article>
    </section>

    <section className="sessionListSection">
      <div className="sectionTitleRow"><div><span className="sectionKicker">الجلسات</span><h2>الورش المنشأة</h2></div><span>{filteredSessions.length} من {sessions.length} جلسة</span></div>
      <div className="workshopToolbar"><label><Search size={16}/><input aria-label="البحث في الورش" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث بالاسم، الرمز، المدرب أو المكان"/></label><div className="statusFilters">{[["all","الكل"],["open","مفتوحة"],["live","مباشرة"],["closed","مغلقة"],["archived","مؤرشفة"]].map(([v,l])=><button type="button" key={v} className={statusFilter===v?"active":""} onClick={()=>setStatusFilter(v)}>{l}</button>)}</div></div>
      <div className="sessionCards">
        {filteredSessions.map(s=>{
          const joinUrl=typeof window!=="undefined"?`${window.location.origin}/w/${s.session_code}`:`/w/${s.session_code}`;
          return <article key={s.id} className="sessionCard">
            <div className="sessionCardTop"><span className={`sessionStatus ${s.status}`}>{s.status==="open"?"مفتوحة":s.status==="live"?"مباشرة":s.status==="closed"?"مغلقة":s.status}</span><b className="sessionCode">{s.session_code}</b></div>
            <small className="sessionProgram">{programTitle(s.program_id)}</small>
            <h3>{s.title}</h3>
            <div className="sessionMeta">
              <span><UsersRound size={14}/>{s.trainer_names?.join("، ")||"لم يسند مدرب بعد"}</span>
              {s.starts_at&&<span><CalendarDays size={14}/>{new Date(s.starts_at).toLocaleString("ar-SA")}</span>}
              {s.venue&&<span><Radio size={14}/>{s.venue}</span>}
            </div>
            <div className="trainerAssignmentBox"><label>إسناد مدرب<select defaultValue="" onChange={e=>{if(e.target.value)void assignTrainer(s.id,e.target.value);e.currentTarget.value=""}}><option value="">اختر المدرب</option>{trainersList.filter(t=>!assignments.some(a=>a.session_id===s.id&&a.trainer_id===t.id)).map(t=><option key={t.id} value={t.id}>{t.full_name||t.email||"مدرب"}</option>)}</select></label><div className="assignedTrainerChips">{assignments.filter(a=>a.session_id===s.id).map(a=>{const t=trainersList.find(x=>x.id===a.trainer_id);return <button type="button" key={a.trainer_id} onClick={()=>void unassignTrainer(s.id,a.trainer_id)} title="إلغاء الإسناد">{t?.full_name||t?.email||"مدرب"} ×</button>})}</div></div>
            <div className="sessionButtons">
              <Link href={`/admin/workshops/${s.id}`} className="primaryButton">لوحة الجلسة <ArrowLeft size={15}/></Link>
              <button className="outlineButton" onClick={()=>void copy(joinUrl)}><Copy size={15}/> نسخ رابط المشارك</button>
              <Link href={`/w/${s.session_code}`} target="_blank" className="iconButton" title="فتح تجربة المشارك"><ExternalLink size={16}/></Link>
            </div>
          </article>
        })}
        {filteredSessions.length===0&&<div className="emptyWorkshops">{sessions.length===0?"أنشئ أول جلسة، ثم أسند المدرب وافتح لوحة التشغيل.":"لا توجد ورش مطابقة للبحث أو التصفية الحالية."}</div>}
      </div>
    </section>
  </main>
}
