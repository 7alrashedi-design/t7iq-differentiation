"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Clock3,
  ExternalLink, MapPin, PlayCircle, QrCode, Sparkles, UsersRound
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile={id:string;role:string;full_name:string|null};
type Session={
  id:string;title:string;session_code:string;status:string;trainer_names:string[];
  venue:string|null;starts_at:string|null;ends_at:string|null;created_at:string;
};
type Assignment={session_id:string;trainer_id:string};

export default function TrainerHome(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [sessions,setSessions]=useState<Session[]>([]);
  const [assignments,setAssignments]=useState<Assignment[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{void load()},[]);

  async function load(){
    setLoading(true);
    const supabase=getSupabaseBrowserClient();
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user){setLoading(false);return}
    const [{data:p},{data:a}]=await Promise.all([
      supabase.from("profiles").select("id,role,full_name").eq("id",session.user.id).maybeSingle(),
      supabase.from("workshop_session_trainers").select("session_id,trainer_id").eq("trainer_id",session.user.id)
    ]);
    setProfile(p as Profile|null);
    const assigned=(a??[]) as Assignment[];
    setAssignments(assigned);
    const ids=assigned.map(x=>x.session_id);
    if(!ids.length){setSessions([]);setLoading(false);return}
    const {data:s}=await supabase.from("workshop_sessions")
      .select("id,title,session_code,status,trainer_names,venue,starts_at,ends_at,created_at")
      .in("id",ids).order("starts_at",{ascending:true});
    setSessions((s??[]) as Session[]);
    setLoading(false);
  }

  const now=Date.now();
  const live=useMemo(()=>sessions.filter(s=>s.status==="live"||s.status==="open"),[sessions]);
  const upcoming=useMemo(()=>sessions.filter(s=>s.status!=="closed"&&s.starts_at&&new Date(s.starts_at).getTime()>now),[sessions]);
  const completed=useMemo(()=>sessions.filter(s=>s.status==="closed"),[sessions]);

  if(loading) return <main className="roleGate"><div className="roleGateCard"><div className="differenceMark"><span>ت</span></div><h1>جارٍ تجهيز مساحة المدرب</h1><p>نرتب ورشك والجلسات المسندة إليك.</p></div></main>;
  if(!profile) return <main className="roleGate"><div className="roleGateCard"><div className="differenceMark"><span>ت</span></div><h1>مساحة المدرب</h1><p>سجّل الدخول بحساب المدرب للوصول إلى ورشك.</p><Link className="primaryButton" href="/login">تسجيل الدخول</Link></div></main>;
  if(profile.role!=="trainer"&&profile.role!=="platform_admin"&&profile.role!=="admin") return <main className="roleGate"><div className="roleGateCard"><h1>لا توجد صلاحية</h1><p>هذه المساحة مخصصة للمدربين.</p><Link className="outlineButton" href="/">العودة</Link></div></main>;

  return <main className="roleWorkspace trainerWorkspace">
    <header className="roleHero trainerHero">
      <div className="roleBrand">
        <div className="differenceMark"><span>ت</span></div>
        <div><span className="sectionKicker">مساحة المدرب</span><h1>مرحبًا {profile.full_name||"بك"}</h1><p>كل ما تحتاجه لتشغيل الورشة في شاشة واحدة، دون تعقيد.</p></div>
      </div>
      <div className="roleHeroActions">
        <Link className="outlineButton" href="/workshop/test">مختبر التجربة</Link>
        {profile.role!=="trainer"&&<Link className="outlineButton" href="/admin">مركز القيادة</Link>}
      </div>
    </header>

    <section className="rolePulseGrid">
      <article><div className="pulseIcon mint"><PlayCircle/></div><div><strong>{live.length}</strong><span>جلسات متاحة الآن</span></div></article>
      <article><div className="pulseIcon blue"><CalendarDays/></div><div><strong>{upcoming.length}</strong><span>ورش قادمة</span></div></article>
      <article><div className="pulseIcon violet"><CheckCircle2/></div><div><strong>{completed.length}</strong><span>ورش مكتملة</span></div></article>
      <article><div className="pulseIcon amber"><UsersRound/></div><div><strong>{assignments.length}</strong><span>إسناداتي</span></div></article>
    </section>

    <section className="journeyRibbon">
      <div className="journeyTitle"><Sparkles/><div><b>رحلة تشغيل الورشة</b><span>أربع محطات واضحة فقط</span></div></div>
      <div className="journeyCompact">
        <div className="isActive"><i>1</i><span>افتح الجلسة</span></div><em/>
        <div><i>2</i><span>اعرض QR</span></div><em/>
        <div><i>3</i><span>تابع التقدم</span></div><em/>
        <div><i>4</i><span>أغلق وصدّر التقرير</span></div>
      </div>
    </section>

    <section className="roleSection">
      <div className="roleSectionHead"><div><span className="sectionKicker">ورشي</span><h2>الجلسات المسندة إليك</h2></div><span>{sessions.length} جلسة</span></div>
      <div className="trainerSessionGrid">
        {sessions.map(s=><article className="trainerSessionCard" key={s.id}>
          <div className="trainerSessionTop">
            <span className={"sessionStatus "+s.status}>{s.status==="live"?"مباشرة":s.status==="open"?"مفتوحة":s.status==="closed"?"مغلقة":s.status}</span>
            <b>{s.session_code}</b>
          </div>
          <h3>{s.title}</h3>
          <div className="trainerMeta">
            {s.starts_at&&<span><Clock3/> {new Date(s.starts_at).toLocaleString("ar-SA",{dateStyle:"medium",timeStyle:"short"})}</span>}
            {s.venue&&<span><MapPin/> {s.venue}</span>}
          </div>
          <div className="trainerSessionActions">
            <Link className="primaryButton" href={"/trainer/session/"+s.id}><BarChart3/> لوحة التشغيل <ArrowLeft/></Link>
            <Link className="outlineButton" href={"/w/"+s.session_code} target="_blank"><QrCode/> تجربة المشارك <ExternalLink/></Link>
          </div>
        </article>)}
        {sessions.length===0&&<div className="roleEmpty"><CalendarDays/><h3>لا توجد ورش مسندة إليك بعد</h3><p>عند إسناد مدير المنصة ورشة لك ستظهر هنا تلقائيًا.</p></div>}
      </div>
    </section>
  </main>
}
