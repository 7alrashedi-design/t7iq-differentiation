"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CheckCircle2, ExternalLink, RefreshCw, UsersRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DemoLive(){
  const supabase=useMemo(()=>getSupabaseBrowserClient(),[]);
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState("");

  async function load(){
    setError("");
    const {data:d,error:e}=await supabase.functions.invoke("workshop-public",{body:{action:"demo_summary",code:"DEMO26"}});
    if(e){setError(e.message);return}
    if(d?.error){setError(d.error);return}
    setData(d);
  }
  useEffect(()=>{load();const t=setInterval(load,5000);return()=>clearInterval(t)},[]);

  if(!data) return <main className="participantGate"><div className="participantGateCard"><div className="differenceMark"><span>ت</span></div><h1>لوحة الاختبار الحية</h1><p>{error||"جارٍ تحميل بيانات الجلسة..."}</p></div></main>;

  const dist=data.distribution||{};
  const total=data.totals?.fingerprints||0;
  return <main className="liveDashboardPage">
    <header className="liveDashboardHeader">
      <div><span className="sectionKicker">اختبار عام • بيانات مجمعة دون أسماء</span><h1>{data.session.title}</h1><p>تتحدث اللوحة كل 5 ثوانٍ أثناء دخول المشاركين إلى جلسة DEMO26.</p></div>
      <div className="liveHeaderActions"><button className="outlineButton" onClick={load}><RefreshCw size={16}/> تحديث</button><Link href="/w/DEMO26" target="_blank" className="primaryButton">فتح تجربة المشارك <ExternalLink size={16}/></Link></div>
    </header>

    <section className="demoLiveMetrics">
      <article><UsersRound size={20}/><strong>{data.totals.participants}</strong><span>دخلوا الجلسة</span></article>
      <article><BarChart3 size={20}/><strong>{data.totals.fingerprints}</strong><span>بصمات مكتملة</span></article>
      <article><CheckCircle2 size={20}/><strong>{data.levels.completed}</strong><span>أكملوا L3</span></article>
      <article><CheckCircle2 size={20}/><strong>{data.totals.applications}</strong><span>طلبات الدراسة</span></article>
    </section>

    <section className="demoLiveGrid">
      <article className="fingerprintLiveCard">
        <div className="liveCardHead"><div><span>بصمة المجموعة</span><h2>التوزيع الحي</h2></div></div>
        <div className="fingerprintBars">
          {["W","O","V","T","K"].map(k=>{
            const v=dist[k]||0,pct=total?Math.round(v/total*100):0;
            return <div key={k}><div className="fingerprintBarLabel"><b>{k}</b><span>{v} • {pct}%</span></div><i><em style={{width:pct+"%"}}/></i></div>
          })}
        </div>
      </article>
      <article className="levelLiveCard">
        <div className="liveCardHead"><div><span>مراحل المنتج</span><h2>التقدم L1 → L3</h2></div></div>
        <div className="levelLiveGrid"><div><span>L1</span><strong>{data.levels.L1}</strong><small>الأساس</small></div><div><span>L2</span><strong>{data.levels.L2}</strong><small>الإتقان</small></div><div><span>L3</span><strong>{data.levels.L3}</strong><small>الاحتراف</small></div><div className="done"><span>✓</span><strong>{data.levels.completed}</strong><small>مكتمل</small></div></div>
      </article>
    </section>

    <section className="demoInstructionCard">
      <span className="sectionKicker">طريقة الاختبار</span>
      <h2>افتح تجربة المشارك في نافذة أو جوال آخر.</h2>
      <p>كلما أكملت المقياس أو اخترت منتجًا أو انتقلت بين المستويات، سترى المؤشرات تتغير هنا تلقائيًا. هذه اللوحة تخفي الأسماء عمدًا لأنها صفحة اختبار عامة.</p>
    </section>
  </main>
}
