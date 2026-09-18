"use client";
import {useEffect,useMemo,useState} from "react";
import {Activity,BarChart3,CheckCircle2,Clock3,RefreshCw,Users,Boxes,ScanLine} from "lucide-react";
import {createClient} from "@supabase/supabase-js";

const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const styleNames:Record<string,string>={W:"كتابي",O:"شفهي",V:"بصري",T:"تقني",K:"أدائي/عملي"};
const styleLabels:Record<string,string>={W:"W",O:"O",V:"V",T:"T",K:"K"};

export default function TrainerLive({params}:{params:Promise<{code:string}>}){
 const [code,setCode]=useState(""); const [data,setData]=useState<any>(null); const [busy,setBusy]=useState(true); const [error,setError]=useState("");
 useEffect(()=>{params.then(p=>setCode(p.code.toUpperCase()))},[params]);
 async function load(){
  if(!code)return; setBusy(true);
  const {data:d,error:e}=await supabase.functions.invoke("workshop-public",{body:{action:"demo_summary",code}});
  if(e||d?.error){setError("تعذر تحميل لوحة الورشة.");setBusy(false);return}
  setData(d);setError("");setBusy(false);
 }
 useEffect(()=>{if(code)load()},[code]);
 useEffect(()=>{if(!code)return;const t=setInterval(load,15000);return()=>clearInterval(t)},[code]);
 const maxDist=useMemo(()=>data?Math.max(1,...Object.values(data.distribution).map(Number)):1,[data]);
 const products=useMemo(()=>data?[...(data.product_counts??[])].sort((a:any,b:any)=>b.count-a.count).slice(0,8):[],[data]);
 if(!data)return <main className="trainerLivePage"><div className="trainerLoading"><Activity/><b>{busy?"جاري تجهيز لوحة المدرب…":error}</b><button onClick={load}><RefreshCw size={15}/> إعادة المحاولة</button></div></main>;
 const t=data.totals,l=data.levels;
 return <main className="trainerLivePage">
  <header className="trainerLiveTop"><div><span className="trainerLiveDot"/><div><b>{data.session.title}</b><small>لوحة المدرب الحية • {code}</small></div></div><button onClick={load} disabled={busy}><RefreshCw size={15} className={busy?"spin":""}/> تحديث الآن</button></header>
  <section className="trainerHero"><div><span>LIVE WORKSHOP</span><h1>ماذا يحدث في الورشة الآن؟</h1><p>قراءة لحظية لمسار المشاركين تساعد المدرب على معرفة أين يتجمعون، وأين يحتاجون تدخلًا أو توجيهًا.</p></div><div className="livePulse"><Activity/><b>{t.participants}</b><span>مشارك دخل التجربة</span><small>تحديث تلقائي كل 15 ثانية</small></div></section>
  <section className="trainerKpis">
   <article><Users/><div><span>المشاركون</span><b>{t.participants}</b></div></article>
   <article><ScanLine/><div><span>أكملوا البصمة</span><b>{t.fingerprints}<small> / {t.participants}</small></b></div></article>
   <article><Boxes/><div><span>اختاروا منتجًا</span><b>{t.products}<small> / {t.participants}</small></b></div></article>
   <article><CheckCircle2/><div><span>أكملوا التجربة</span><b>{t.completed}</b></div></article>
  </section>
  <section className="trainerGrid">
   <article className="trainerPanel"><div className="trainerPanelHead"><div><span>البصمات</span><h2>كيف يتوزع المشاركون؟</h2></div><BarChart3/></div><div className="fingerprintBars">{Object.entries(data.distribution).map(([k,v]:any)=><div key={k}><div><b>{styleLabels[k]}</b><span>{styleNames[k]}</span></div><div className="trainerBar"><i style={{width:(Number(v)/maxDist*100)+"%"}}/></div><strong>{v}</strong></div>)}</div></article>
   <article className="trainerPanel"><div className="trainerPanelHead"><div><span>مسار المنتج</span><h2>أين وصل المشاركون؟</h2></div><Activity/></div><div className="levelLive"><div><b>L1</b><span>الأساس</span><strong>{l.L1}</strong></div><i/><div><b>L2</b><span>الإتقان</span><strong>{l.L2}</strong></div><i/><div><b>L3</b><span>الاحتراف</span><strong>{l.L3}</strong></div><i/><div className="completed"><b>✓</b><span>مكتمل</span><strong>{l.completed}</strong></div></div><div className="trainerIntervention"><Clock3/><div><b>مؤشر تدخل المدرب</b><span>{l.L1>l.L2+l.L3&&t.products>3?"يتركز المشاركون حاليًا في المستوى الأول؛ راقب أكثر معايير L1 تعثرًا قبل الانتقال الجماعي.":"التوزيع يتحرك عبر المسار؛ استمر في متابعة نقاط التعثر قبل تقديم التوجيه."}</span></div></div></article>
  </section>
  {data.evaluation_intelligence?.attempts>0&&<section className="trainerDecision">
    <div className="trainerDecisionHead"><div><span>DECISION ENGINE</span><h2>أين يحتاج المشاركون تدخلًا الآن؟</h2><p>قراءة جماعية من التقييمات المسجلة، وليست حكمًا على مشارك بعينه.</p></div><div><small>محاولات محللة</small><b>{data.evaluation_intelligence.attempts}</b></div></div>
    <div className="trainerDecisionGrid">
      <article className="groupAxes"><span>أداء المحاور</span>{(data.evaluation_intelligence.section_analysis??[]).map((s:any)=><div key={s.section}><div><b>{s.section}</b><small>{s.low_rate}% أقل من 4</small></div><div className="decisionBar"><i style={{width:(s.average/6*100)+"%"}}/></div><strong>{s.average}<small>/6</small></strong></div>)}</article>
      <article className="liveIntervention"><span>تدخل قصير مقترح</span><h3>{data.evaluation_intelligence.intervention?.title}</h3><p>{data.evaluation_intelligence.intervention?.prompt}</p><div><Clock3 size={15}/><b>2–4 دقائق</b><small>ثم اترك المشاركين يعودون إلى منتجاتهم ويعيدون المحاولة.</small></div></article>
    </div>
    {(data.evaluation_intelligence.criterion_gaps??[]).length>0&&<div className="groupGaps"><div><span>أكثر المعايير احتياجًا للتطوير</span><small>تظهر بعد وجود تقييمين على الأقل للمعيار</small></div><div>{data.evaluation_intelligence.criterion_gaps.slice(0,3).map((g:any,i:number)=><article key={g.criterion}><span>{i+1}</span><div><b>{g.section}</b><p>{g.criterion}</p></div><strong>{g.average}<small>/6</small></strong></article>)}</div></div>}
  </section>}
  <section className="trainerPanel productsLive"><div className="trainerPanelHead"><div><span>الاختيار الحر</span><h2>المنتجات الأكثر اختيارًا</h2></div><Boxes/></div>{products.length?<div className="productLiveList">{products.map((p:any,i:number)=><div key={p.product_id}><span>{String(i+1).padStart(2,"0")}</span><b>{p.product_id}</b><div><i style={{width:(p.count/Math.max(1,products[0].count)*100)+"%"}}/></div><strong>{p.count}</strong></div>)}</div>:<p className="trainerEmpty">لم يبدأ اختيار المنتجات بعد.</p>}</section>
  <footer className="trainerLiveFooter"><span>التمايز • لوحة المدرب</span><span>البيانات المعروضة تشغيلية ولا تعرض معلومات الاتصال بالمشاركين.</span></footer>
 </main>
}