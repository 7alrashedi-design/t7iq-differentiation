"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, CalendarDays, CheckCircle2, GraduationCap,
  Presentation, QrCode, Sparkles, UserCog, UsersRound
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Session={id:string;title:string;session_code:string;status:string;starts_at:string|null;venue:string|null};
type Profile={role:string;full_name:string|null};

export default function TrainingCenter(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [sessions,setSessions]=useState<Session[]>([]);
  const [trainerCount,setTrainerCount]=useState(0);
  const [participantCount,setParticipantCount]=useState(0);
  const [completedCount,setCompletedCount]=useState(0);
  const [qualifiedCount,setQualifiedCount]=useState(0);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{void load()},[]);
  async function load(){
    const s=getSupabaseBrowserClient();
    const {data:{session}}=await s.auth.getSession();
    if(!session?.user){setLoading(false);return}
    const [{data:p},{data:ws},{count:tc},{count:pc},{count:cc},{count:qc}]=await Promise.all([
      s.from("profiles").select("role,full_name").eq("id",session.user.id).maybeSingle(),
      s.from("workshop_sessions").select("id,title,session_code,status,starts_at,venue").order("created_at",{ascending:false}).limit(6),
      s.from("profiles").select("id",{count:"exact",head:true}).eq("role","trainer"),
      s.from("workshop_participants").select("id",{count:"exact",head:true}),
      s.from("workshop_participants").select("id",{count:"exact",head:true}).not("completed_at","is",null),
      s.from("workshop_participants").select("id",{count:"exact",head:true}).eq("qualification_status","qualified")
    ]);
    setProfile(p as Profile|null);setSessions((ws??[]) as Session[]);
    setTrainerCount(tc??0);setParticipantCount(pc??0);setCompletedCount(cc??0);setQualifiedCount(qc??0);setLoading(false);
  }

  const openCount=useMemo(()=>sessions.filter(x=>x.status==="open"||x.status==="live").length,[sessions]);

  if(loading) return <main className="roleGate"><div className="roleGateCard"><div className="differenceMark"><span>ت</span></div><h1>جارٍ تجهيز مركز الورشة</h1><p>نرتب البرامج والمدربين والجلسات.</p></div></main>;
  if(!profile) return <main className="roleGate"><div className="roleGateCard"><h1>مركز الورشة والتأهيل</h1><p>سجل الدخول بحساب مدير المنصة.</p><Link className="primaryButton" href="/login">تسجيل الدخول</Link></div></main>;
  if(!["platform_admin","admin"].includes(profile.role)) return <main className="roleGate"><div className="roleGateCard"><h1>لا توجد صلاحية</h1><p>هذه الصفحة لمدير المنصة.</p><Link className="outlineButton" href="/">العودة</Link></div></main>;

  return <main className="roleWorkspace trainingCenter">
    <header className="roleHero">
      <div className="roleBrand"><div className="differenceMark"><span>ت</span></div><div><span className="sectionKicker">الجزء الأول • الورشة والتأهيل</span><h1>مركز رحلة الورشة</h1><p>أنشئ التجربة، أسند المدرب، ثم تابع المتدربين من الدخول حتى التقرير.</p></div></div>
      <div className="roleHeroActions"><Link className="outlineButton" href="/admin">مركز القيادة</Link><Link className="outlineButton" href="/admin/training/report">التقرير الشامل</Link><Link className="outlineButton" href="/admin/training/acceptance">اختبار القبول</Link><Link className="primaryButton" href="/admin/workshops">إدارة الورش <ArrowLeft/></Link></div>
    </header>

    <section className="rolePulseGrid">
      <article><div className="pulseIcon mint"><Presentation/></div><div><strong>{sessions.length}</strong><span>ورش وجلسات</span></div></article>
      <article><div className="pulseIcon blue"><UserCog/></div><div><strong>{trainerCount}</strong><span>مدربون</span></div></article>
      <article><div className="pulseIcon violet"><UsersRound/></div><div><strong>{participantCount}</strong><span>مشاركون</span></div></article>
      <article><div className="pulseIcon amber"><CheckCircle2/></div><div><strong>{qualifiedCount}</strong><span>تم تأهيلهم</span></div></article>
    </section>

    <section className="trainingPath">
      <article><span>01</span><div className="pathIcon"><GraduationCap/></div><h2>صمّم الورشة</h2><p>اسم الجلسة، الموعد، المكان، المقياس، المنتجات ومعايير الاجتياز.</p><Link href="/admin/workshops">إنشاء وإدارة الورش <ArrowLeft/></Link></article>
      <article><span>02</span><div className="pathIcon"><UserCog/></div><h2>أسند المدرب</h2><p>اختر المدرب المناسب لكل جلسة. سيظهر له فقط ما تم إسناده إليه.</p><Link href="/admin">إدارة الحسابات <ArrowLeft/></Link></article>
      <article><span>03</span><div className="pathIcon"><QrCode/></div><h2>شغّل التجربة</h2><p>كود وQR للدخول، متابعة مباشرة، وتحكم في فتح وإغلاق الجلسة.</p><Link href="/admin/workshops">لوحات الجلسات <ArrowLeft/></Link></article>
      <article><span>04</span><div className="pathIcon"><BarChart3/></div><h2>اقرأ الأثر</h2><p>توزيع البصمات، مستويات المنتج، الإكمال، اعتماد التأهيل، وتقارير المشاركين.</p><Link href="/workshop/test">اختبار التجربة <ArrowLeft/></Link></article>
    </section>

    <section className="roleSection">
      <div className="roleSectionHead"><div><span className="sectionKicker">نظرة تشغيلية</span><h2>أحدث الجلسات</h2></div><span>{openCount} متاحة الآن</span></div>
      <div className="trainingSessionList">
        {sessions.map(s=><article key={s.id}>
          <div><span className={"sessionStatus "+s.status}>{s.status==="live"?"مباشرة":s.status==="open"?"مفتوحة":s.status==="closed"?"مغلقة":s.status}</span><b>{s.title}</b><small>{s.starts_at?new Date(s.starts_at).toLocaleString("ar-SA",{dateStyle:"medium",timeStyle:"short"}):"لم يحدد الموعد"} {s.venue?"• "+s.venue:""}</small></div>
          <div className="trainingSessionActions"><code>{s.session_code}</code><Link className="outlineButton" href={"/admin/workshops/"+s.id}>فتح اللوحة <ArrowLeft/></Link></div>
        </article>)}
        {sessions.length===0&&<div className="roleEmpty"><CalendarDays/><h3>ابدأ بأول ورشة</h3><p>أنشئ جلسة ثم أسند لها مدربًا لتبدأ رحلة التأهيل.</p></div>}
      </div>
    </section>

    <section className="journeyPrinciple">
      <Sparkles/><div><b>قاعدة التصميم</b><p>مدير المنصة يبني ويعتمد، المدرب يشغّل ويوجّه، والمتدرب يعيش التجربة دون تعقيد إداري.</p></div>
    </section>
  </main>
}
