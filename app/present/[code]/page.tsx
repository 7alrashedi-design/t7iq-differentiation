"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import QRCode from "qrcode";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";
import "./cairo.css";

const deckId="1pLBZx1olhefO_lGhEkecRSW3yQTXhoJgZ5achnxvLD0";
const firstSourcePage=2, lastSourcePage=38;
const ASLOOBI_PAGE=11;
type Counts={totals:{participants:number;fingerprints:number;products:number};distribution:Record<string,number>};
export default function ExactWorkshopPresentation(){
 const params=useParams<{code:string}>();
 const code=String(params.code??"").toUpperCase();
 const db=useMemo(()=>getSupabaseBrowserClient(),[]);
 const [sourcePage,setSourcePage]=useState(2);
 const [session,setSession]=useState<any>(null);
 const [stats,setStats]=useState<Counts|null>(null);
 const [qr,setQr]=useState("");
 const [authorized,setAuthorized]=useState(false);
 const [showControls,setShowControls]=useState(false);
 const [activity,setActivity]=useState<"none"|"join"|"results">("none");
 const [notice,setNotice]=useState("");
 const [refreshTime,setRefreshTime]=useState("");
 const [loading,setLoading]=useState(false);
 const joinUrl=typeof window!=="undefined"?location.origin+"/w/"+code:"";
 const slideId="refpage_"+String(sourcePage).padStart(3,"0");
 const slideUrl="https://docs.google.com/presentation/d/"+deckId+"/embed?start=false&loop=false&delayms=600000#slide=id."+slideId;
 const deckUrl="https://docs.google.com/presentation/d/"+deckId+"/edit#slide=id."+slideId;
 const isActivityPage=sourcePage===ASLOOBI_PAGE;
 const activePhase=session?.settings?.trainer_controlled_phases===true?Number(session.settings.active_phase??0):3;
 const load=useCallback(async()=>{
  if(!code)return;
  try{
    const [a,b]=await Promise.all([
      db.functions.invoke("workshop-public",{body:{action:"session",code}}),
      db.functions.invoke("workshop-public",{body:{action:"live_summary",code}})
    ]);
    if(a.error||!a.data?.session)throw new Error("session");
    setSession(a.data.session);
    if(!b.error&&b.data?.totals){setStats(b.data as Counts);setNotice("");}else{setStats(null);setNotice("تعذّر تحميل الإحصاءات؛ لن تُعرض أرقام غير محدثة.")}
    setRefreshTime(new Date().toLocaleTimeString("ar-SA"));
  }catch{setStats(null);setNotice("تعذّر التحقق من الجلسة الحالية.")}
 },[code,db]);
 useEffect(()=>{void load();const t=setInterval(()=>void load(),4000);return()=>clearInterval(t)},[load]);
 useEffect(()=>{if(!code)return;void QRCode.toDataURL(location.origin+"/w/"+code,{width:460,margin:1}).then(setQr).catch(()=>{});},[code]);
 useEffect(()=>{void db.auth.getUser().then(x=>setAuthorized(Boolean(x.data.user)));const {data}=db.auth.onAuthStateChange((_e,x)=>setAuthorized(Boolean(x?.user)));return()=>data.subscription.unsubscribe()},[db]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest("input,textarea,select"))return;if(e.key==="ArrowLeft")setSourcePage(p=>Math.min(lastSourcePage,p+1));if(e.key==="ArrowRight")setSourcePage(p=>Math.max(firstSourcePage,p-1));if(e.key.toLowerCase()==="f")void document.documentElement.requestFullscreen?.().catch(()=>{})};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
 useEffect(()=>{if(sourcePage!==ASLOOBI_PAGE)setActivity("none")},[sourcePage]);
 async function startAsloobi(){
  if(!authorized||!session?.id){setNotice("يلزم دخول المدرب المخوّل لإدارة هذه الجلسة.");return}
  if(session.settings?.trainer_controlled_phases!==true){setNotice("فعّل التحكم المرحلي أولًا من إدارة الجلسة.");return}
  const current=Number(session.settings?.active_phase??0);
  if(current>1){setActivity("join");return}
  setLoading(true);
  const settings={...(session.settings??{}),active_phase:1};
  const {data,error}=await db.from("workshop_sessions").update({settings}).eq("id",session.id).select("id").maybeSingle();
  setLoading(false);
  if(error||!data){setNotice("تعذر فتح أسلوبي، تأكد من صلاحية إدارة الجلسة.");return}
  setSession({...session,settings});setActivity("join");setNotice("");
 }
 const total=stats?.totals.participants??null;
 const completed=stats?.totals.fingerprints??null;
 return <main className="exactDeckRoot" dir="rtl">
   <div className="exactDeckPage">
    <iframe key={slideId} className="exactDeckIframe" src={slideUrl} title={`الصفحة الأصلية ${sourcePage} من العرض المرجعي`} allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
    {activity!=="none"&&isActivityPage&&<div className="exactActivityLayer">
      <button className="exactClose" onClick={()=>setActivity("none")} aria-label="إغلاق">×</button>
      {activity==="join"?<>
        <h2>المهمة التربوية (1) — أسلوبي</h2><p>امسح رمز الجلسة الحالية وأكمل المقياس.</p>
        <div className="exactJoinCard">{qr&&<img src={qr} alt="رمز QR لجلسة أسلوبي الحالية"/>}<div><strong>{code}</strong><span>{joinUrl}</span><span>متدربون في الجلسة: {total??"—"}</span><span>أكملوا المقياس: {completed??"—"}</span></div></div>
        <button onClick={()=>setActivity("results")} className="exactPrimary">إظهار النتائج المجمعة</button>
      </>:<>
        <h2>ملخص نتائج أسلوبي — {code}</h2>
        <div className="exactMetrics"><div><b>{total??"—"}</b>المشاركون</div><div><b>{completed??"—"}</b>أكملوا المقياس</div></div>
        <div className="exactBars">{Object.entries(stats?.distribution??{}).map(([k,v])=><div key={k}><span>{k}</span><progress max={Math.max(1,completed??0)} value={v}/><b>{v}</b></div>)}</div>
        <button className="exactPrimary" onClick={()=>setActivity("join")}>العودة إلى الباركود</button>
      </>}
    </div>}
   </div>
   <nav className="exactDeckBar" aria-label="أدوات المدرب">
     <button onClick={()=>setSourcePage(p=>Math.max(firstSourcePage,p-1))} disabled={sourcePage===firstSourcePage}>السابق</button>
     <span>الصفحة {sourcePage-1} / 37</span>
     <button onClick={()=>setSourcePage(p=>Math.min(lastSourcePage,p+1))} disabled={sourcePage===lastSourcePage}>التالي</button>
     {isActivityPage&&<button className="exactPrimary" onClick={()=>void startAsloobi()} disabled={loading}>بدء أسلوبي وعرض QR</button>}
     {isActivityPage&&<button onClick={()=>setActivity("results")}>نتائج أسلوبي</button>}
     <button onClick={()=>void document.documentElement.requestFullscreen?.().catch(()=>{})}>ملء الشاشة</button>
     <button onClick={()=>setShowControls(v=>!v)}>خيارات</button>
   </nav>
   {showControls&&<aside className="exactDeckControls">
      <b>جلسة {code}</b><small>{session?.title??"لم تُحمّل الجلسة بعد"}</small>
      <span>آخر تحديث: {refreshTime||"—"}</span>
      <span>متدربون: {total??"—"} • استكملوا: {completed??"—"}</span>
      <span>المرحلة المفتوحة: {activePhase}</span>
      <a href={deckUrl} target="_blank" rel="noreferrer">فتح الصفحة الأصلية في Google Slides</a>
      <a href={session?.id?"/admin/workshops/"+session.id:"/trainer"} target="_blank" rel="noreferrer">إدارة الورشة</a>
      <button onClick={()=>setShowControls(false)}>إغلاق</button>
    </aside>}
    {notice&&<p role="status" className="exactDeckNotice">{notice}</p>}
 </main>;
}
