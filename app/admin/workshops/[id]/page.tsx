"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import QRCode from "qrcode";
import {
  ArrowRight, BarChart3, CheckCircle2, Copy, Download, ExternalLink,
  PauseCircle, PlayCircle, QrCode, RefreshCw, UsersRound
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Session={id:string;title:string;session_code:string;status:string;trainer_names:string[];venue:string|null;starts_at:string|null;settings:any};
type Participant={id:string;full_name:string;organization_name:string|null;joined_at:string;completed_at:string|null};
type Fingerprint={participant_id:string;fingerprint_code:string;primary_code:string;dimension_scores:any};
type ParticipantProduct={id:string;participant_id:string;product_id:string;current_level:number;status:string};
type Application={participant_id:string;status:string};

export default function WorkshopDashboard(){
  const params=useParams<{id:string}>();
  const id=params.id;
  const [session,setSession]=useState<Session|null>(null);
  const [participants,setParticipants]=useState<Participant[]>([]);
  const [fingerprints,setFingerprints]=useState<Fingerprint[]>([]);
  const [products,setProducts]=useState<ParticipantProduct[]>([]);
  const [applications,setApplications]=useState<Application[]>([]);
  const [qr,setQr]=useState("");
  const [notice,setNotice]=useState("");
  const [auto,setAuto]=useState(true);

  async function idsFor(sessionId:string){
    const supabase=getSupabaseBrowserClient();
    const {data}=await supabase.from("workshop_participants").select("id").eq("session_id",sessionId);
    return (data??[]).map(x=>x.id);
  }

  async function load(){
    if(!id) return;
    const supabase=getSupabaseBrowserClient();
    const ids=await idsFor(id);
    const [{data:s},{data:p},{data:f},{data:pp},{data:a}]=await Promise.all([
      supabase.from("workshop_sessions").select("id,title,session_code,status,trainer_names,venue,starts_at,settings").eq("id",id).maybeSingle(),
      supabase.from("workshop_participants").select("id,full_name,organization_name,joined_at,completed_at").eq("session_id",id).order("joined_at"),
      ids.length?supabase.from("fingerprint_results").select("participant_id,fingerprint_code,primary_code,dimension_scores").in("participant_id",ids):Promise.resolve({data:[]}),
      ids.length?supabase.from("participant_products").select("id,participant_id,product_id,current_level,status").in("participant_id",ids):Promise.resolve({data:[]}),
      ids.length?supabase.from("workshop_applications").select("participant_id,status").in("participant_id",ids):Promise.resolve({data:[]})
    ]);
    if(s) setSession(s as Session);
    setParticipants((p??[]) as Participant[]);
    setFingerprints((f??[]) as Fingerprint[]);
    setProducts((pp??[]) as ParticipantProduct[]);
    setApplications((a??[]) as Application[]);
  }

  useEffect(()=>{load()},[id]);
  useEffect(()=>{
    if(!auto) return;
    const t=setInterval(load,5000);
    return()=>clearInterval(t);
  },[auto,id]);

  useEffect(()=>{
    if(!session || typeof window==="undefined") return;
    const url=window.location.origin+"/w/"+session.session_code;
    QRCode.toDataURL(url,{width:360,margin:1,color:{dark:"#1f3545",light:"#ffffff"}}).then(setQr).catch(()=>{});
  },[session]);

  const distributions=useMemo(()=>{
    const keys=["W","O","V","T","K"];
    const counts:Record<string,number>=Object.fromEntries(keys.map(k=>[k,0]));
    fingerprints.forEach(f=>{
      const code=f.primary_code.toUpperCase();
      const k=code.startsWith("K")?"K":code;
      counts[k]=(counts[k]??0)+1;
    });
    return counts;
  },[fingerprints]);

  const levelStats=useMemo(()=>({
    l1:products.filter(p=>p.current_level===1&&p.status!=="completed").length,
    l2:products.filter(p=>p.current_level===2&&p.status!=="completed").length,
    l3:products.filter(p=>p.current_level===3&&p.status!=="completed").length,
    done:products.filter(p=>p.status==="completed").length
  }),[products]);

  async function updateStatus(status:string){
    const supabase=getSupabaseBrowserClient();
    const {error}=await supabase.from("workshop_sessions").update({status}).eq("id",id);
    if(error){setNotice(error.message);return}
    setNotice(status==="live"?"الجلسة الآن مباشرة.":status==="closed"?"تم إغلاق دخول المشاركين.":"تم فتح الجلسة.");
    await load();
  }

  async function copyLink(){
    if(!session) return;
    await navigator.clipboard.writeText(window.location.origin+"/w/"+session.session_code);
    setNotice("تم نسخ رابط المشاركة.");
  }

  function exportCSV(){
    const header=["الاسم","الجهة","البصمة","المنتج","المستوى","الحالة","طلب الدراسة"];
    const rows=participants.map(p=>{
      const fp=fingerprints.find(f=>f.participant_id===p.id);
      const pr=products.find(x=>x.participant_id===p.id);
      const ap=applications.find(x=>x.participant_id===p.id);
      return [p.full_name,p.organization_name??"",fp?.fingerprint_code??"",pr?.product_id??"",pr?.current_level??"",pr?.status??"",ap?.status??""];
    });
    const csv=[header,...rows].map(r=>r.map(v=>"\""+String(v).replaceAll("\"","\"\"")+"\"").join(",")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=(session?.title??"workshop")+"-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if(!session) return <main className="adminGate"><div className="adminGateCard refinedGate"><h1>جارٍ تحميل الجلسة</h1><p>إذا استمر الانتظار فتأكد من صلاحيات حساب المدرب.</p></div></main>;

  const joinUrl=typeof window!=="undefined"?window.location.origin+"/w/"+session.session_code:"";
  return <main className="liveDashboardPage">
    <header className="liveDashboardHeader">
      <div>
        <Link href={trainerView?"/trainer":"/admin/workshops"} className="backLink"><ArrowRight size={16}/> {trainerView?"مساحة المدرب":"الورش"}</Link>
        <span className="sectionKicker">لوحة المدرب الحية</span>
        <h1>{session.title}</h1>
        <p>{session.trainer_names?.join("، ")} {session.venue?"• "+session.venue:""}</p>
      </div>
      <div className="liveHeaderActions">
        <button className="outlineButton" onClick={()=>setAuto(v=>!v)}>{auto?<PauseCircle size={16}/>:<PlayCircle size={16}/>} {auto?"إيقاف التحديث":"تشغيل التحديث"}</button>
        <button className="outlineButton" onClick={load}><RefreshCw size={16}/> تحديث</button>
        <button className="outlineButton" onClick={exportCSV}><Download size={16}/> CSV</button>
        <button className="outlineButton" onClick={()=>window.print()}><Download size={16}/> تقرير PDF</button>
      </div>
    </header>

    {notice&&<div className="adminNotice">{notice}</div>}

    <section className="liveHeroGrid">
      <article className="sessionAccessCard">
        <div className="sessionCodeBig">{session.session_code}</div>
        <h2>ادخل إلى الورشة</h2>
        <p>امسح الرمز أو افتح الرابط، ثم اكتب الاسم والجهة فقط.</p>
        {qr?<img src={qr} alt="QR للدخول إلى الورشة"/>:<div className="qrPlaceholder"><QrCode size={34}/></div>}
        <div className="accessButtons">
          <button className="outlineButton" onClick={copyLink}><Copy size={15}/> نسخ الرابط</button>
          <Link href={joinUrl} target="_blank" className="outlineButton">فتح <ExternalLink size={15}/></Link>
        </div>
        <div className="sessionStateButtons">
          <button onClick={()=>updateStatus("open")} className={session.status==="open"?"active":""}>فتح</button>
          <button onClick={()=>updateStatus("live")} className={session.status==="live"?"active":""}>مباشر</button>
          <button onClick={()=>updateStatus("closed")} className={session.status==="closed"?"active":""}>إغلاق</button>
        </div>
      </article>

      <article className="liveMetricsCard">
        <div className="liveMetric"><UsersRound size={20}/><div><strong>{participants.length}</strong><span>مشاركًا دخلوا</span></div></div>
        <div className="liveMetric"><BarChart3 size={20}/><div><strong>{fingerprints.length}</strong><span>أكملوا «أسلوبي»</span></div></div>
        <div className="liveMetric"><CheckCircle2 size={20}/><div><strong>{levelStats.done}</strong><span>أكملوا مستويات المنتج</span></div></div>
        <div className="liveMetric"><PlayCircle size={20}/><div><strong>{applications.length}</strong><span>طلبات الدراسة السنوية</span></div></div>
      </article>

      <article className="fingerprintLiveCard">
        <div className="liveCardHead"><div><span>بصمة المجموعة</span><h2>W / O / V / T / K</h2></div><BarChart3 size={20}/></div>
        <div className="fingerprintBars">
          {Object.entries(distributions).map(([k,v])=>{
            const pct=fingerprints.length?Math.round((v/fingerprints.length)*100):0;
            return <div key={k}><div className="fingerprintBarLabel"><b>{k}</b><span>{v} • {pct}%</span></div><i><em style={{width:pct+"%"}}/></i></div>
          })}
        </div>
      </article>

      <article className="levelLiveCard">
        <div className="liveCardHead"><div><span>رحلة المنتج</span><h2>الانتقال بين المستويات</h2></div></div>
        <div className="levelLiveGrid">
          <div><span>L1</span><strong>{levelStats.l1}</strong><small>أساس المنتج</small></div>
          <div><span>L2</span><strong>{levelStats.l2}</strong><small>الإتقان</small></div>
          <div><span>L3</span><strong>{levelStats.l3}</strong><small>الاحتراف</small></div>
          <div className="done"><span>✓</span><strong>{levelStats.done}</strong><small>أكملوا</small></div>
        </div>
      </article>
    </section>

    <section className="liveParticipantsSection">
      <div className="sectionTitleRow"><div><span className="sectionKicker">متابعة لحظية</span><h2>المشاركون</h2></div><span>{participants.length}</span></div>
      <div className="liveTableWrap">
        <table className="liveTable"><thead><tr><th>المشارك</th><th>الجهة</th><th>البصمة</th><th>المنتج</th><th>المستوى</th><th>الحالة</th><th>الدراسة السنوية</th></tr></thead>
          <tbody>{participants.map(p=>{
            const fp=fingerprints.find(x=>x.participant_id===p.id);
            const pr=products.find(x=>x.participant_id===p.id);
            const ap=applications.find(x=>x.participant_id===p.id);
            return <tr key={p.id}><td><b>{p.full_name}</b></td><td>{p.organization_name||"—"}</td><td>{fp?.fingerprint_code||"يطبق المقياس"}</td><td>{pr?.product_id||"—"}</td><td>{pr?"L"+pr.current_level:"—"}</td><td>{pr?.status==="completed"?"مكتمل":pr?"قيد التطوير":"—"}</td><td>{ap?"أرسل الطلب":"—"}</td></tr>
          })}</tbody>
        </table>
      </div>
    </section>

    <footer className="reportFooter"><span>التمايز • لوحة المدرب</span><span>تحديث تلقائي كل 5 ثوانٍ</span></footer>
  </main>
}
