"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Download, GraduationCap, Presentation, UsersRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Program={id:string;title:string;status:string};
type Session={id:string;program_id:string|null;title:string;session_code:string;status:string;starts_at:string|null;venue:string|null};
type Participant={id:string;session_id:string;qualification_status:string;completed_at:string|null};
type Fingerprint={participant_id:string;primary_code:string};
type Product={participant_id:string;status:string};

export default function TrainingReport(){
  const [programs,setPrograms]=useState<Program[]>([]);
  const [sessions,setSessions]=useState<Session[]>([]);
  const [participants,setParticipants]=useState<Participant[]>([]);
  const [fingerprints,setFingerprints]=useState<Fingerprint[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [loading,setLoading]=useState(true);
  const [authorized,setAuthorized]=useState(false);

  useEffect(()=>{void load()},[]);

  async function load(){
    const s=getSupabaseBrowserClient();
    const {data:{session}}=await s.auth.getSession();
    if(!session?.user){setLoading(false);return}
    const {data:profile}=await s.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
    if(!["platform_admin","admin"].includes(profile?.role??"")){setLoading(false);return}
    setAuthorized(true);
    const [{data:pr},{data:ss},{data:pp}]=await Promise.all([
      s.from("training_programs").select("id,title,status").order("created_at"),
      s.from("workshop_sessions").select("id,program_id,title,session_code,status,starts_at,venue").order("created_at"),
      s.from("workshop_participants").select("id,session_id,qualification_status,completed_at").order("joined_at")
    ]);
    const p=(pp??[]) as Participant[];
    const ids=p.map(x=>x.id);
    const [{data:fp},{data:prod}]=await Promise.all([
      ids.length?s.from("fingerprint_results").select("participant_id,primary_code").in("participant_id",ids):Promise.resolve({data:[]}),
      ids.length?s.from("participant_products").select("participant_id,status").in("participant_id",ids):Promise.resolve({data:[]})
    ]);
    setPrograms((pr??[]) as Program[]);
    setSessions((ss??[]) as Session[]);
    setParticipants(p);
    setFingerprints((fp??[]) as Fingerprint[]);
    setProducts((prod??[]) as Product[]);
    setLoading(false);
  }

  const totals=useMemo(()=>({
    sessions:sessions.length,
    participants:participants.length,
    completed:products.filter(x=>x.status==="completed").length,
    qualified:participants.filter(x=>x.qualification_status==="qualified").length
  }),[sessions,participants,products]);

  const dist=useMemo(()=>{
    const out:Record<string,number>={W:0,O:0,V:0,T:0,K:0};
    fingerprints.forEach(x=>{const k=x.primary_code?.toUpperCase().startsWith("K")?"K":x.primary_code?.toUpperCase();if(k&&k in out)out[k]++});
    return out;
  },[fingerprints]);

  function sessionStats(id:string){
    const ps=participants.filter(p=>p.session_id===id);
    const ids=new Set(ps.map(p=>p.id));
    return {
      participants:ps.length,
      completed:products.filter(x=>ids.has(x.participant_id)&&x.status==="completed").length,
      qualified:ps.filter(x=>x.qualification_status==="qualified").length
    };
  }

  if(loading) return <main className="roleGate"><div className="roleGateCard"><h1>جارٍ إعداد التقرير</h1><p>نجمع نتائج الورش والتأهيل.</p></div></main>;
  if(!authorized) return <main className="roleGate"><div className="roleGateCard"><h1>التقرير الإداري</h1><p>هذه الصفحة متاحة لمدير المنصة.</p><Link href="/login" className="primaryButton">تسجيل الدخول</Link></div></main>;

  return <main className="roleWorkspace trainingReportPage">
    <header className="roleHero">
      <div className="roleBrand"><div className="differenceMark"><span>ت</span></div><div><span className="sectionKicker">تقرير الجزء الأول</span><h1>الورشة والتأهيل</h1><p>صورة تنفيذية موحدة للبرامج والجلسات والمشاركين وحالة التأهيل.</p></div></div>
      <div className="roleHeroActions"><Link href="/admin/training" className="outlineButton"><ArrowRight/> مركز الورشة</Link><button className="primaryButton" onClick={()=>window.print()}><Download/> حفظ PDF</button></div>
    </header>

    <section className="rolePulseGrid">
      <article><div className="pulseIcon mint"><Presentation/></div><div><strong>{totals.sessions}</strong><span>جلسة</span></div></article>
      <article><div className="pulseIcon blue"><UsersRound/></div><div><strong>{totals.participants}</strong><span>مشارك</span></div></article>
      <article><div className="pulseIcon violet"><CheckCircle2/></div><div><strong>{totals.completed}</strong><span>أكملوا المنتج</span></div></article>
      <article><div className="pulseIcon amber"><GraduationCap/></div><div><strong>{totals.qualified}</strong><span>مؤهل</span></div></article>
    </section>

    <section className="trainingReportGrid">
      <article className="reportPanel">
        <div className="reportPanelHead"><div><span className="sectionKicker">البصمة الجماعية</span><h2>توزيع أساليب التعبير</h2></div><BarChart3/></div>
        <div className="fingerprintBars">
          {Object.entries(dist).map(([k,v])=>{const pct=fingerprints.length?Math.round(v/fingerprints.length*100):0;return <div key={k}><div className="fingerprintBarLabel"><b>{k}</b><span>{v} • {pct}%</span></div><i><em style={{width:pct+"%"}}/></i></div>})}
        </div>
      </article>
      <article className="reportPanel">
        <div className="reportPanelHead"><div><span className="sectionKicker">البرامج</span><h2>حالة البرامج التدريبية</h2></div><GraduationCap/></div>
        <div className="programReportList">{programs.map(p=><div key={p.id}><b>{p.title}</b><span>{p.status==="published"?"منشور":p.status==="draft"?"مسودة":"مؤرشف"}</span><small>{sessions.filter(s=>s.program_id===p.id).length} جلسة</small></div>)}{programs.length===0&&<p>لا توجد برامج بعد.</p>}</div>
      </article>
    </section>

    <section className="roleSection">
      <div className="roleSectionHead"><div><span className="sectionKicker">تفصيل الجلسات</span><h2>الأداء حسب الورشة</h2></div></div>
      <div className="liveTableWrap">
        <table className="liveTable"><thead><tr><th>الورشة</th><th>البرنامج</th><th>الحالة</th><th>المشاركون</th><th>أكملوا المنتج</th><th>مؤهلون</th></tr></thead>
        <tbody>{sessions.map(s=>{const x=sessionStats(s.id);const program=programs.find(p=>p.id===s.program_id);return <tr key={s.id}><td><b>{s.title}</b><small className="tableSub">{s.session_code}</small></td><td>{program?.title||"مستقلة"}</td><td>{s.status}</td><td>{x.participants}</td><td>{x.completed}</td><td>{x.qualified}</td></tr>})}</tbody></table>
      </div>
    </section>

    <footer className="reportFooter"><span>التمايز • تقرير الورشة والتأهيل</span><span>{new Date().toLocaleDateString("ar-SA")}</span></footer>
  </main>
}
