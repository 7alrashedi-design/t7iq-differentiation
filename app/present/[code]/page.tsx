"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {useParams} from "next/navigation";
import QRCode from "qrcode";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";
import "./cairo.css";
import SnapshotPdfSlide from "./SnapshotPdfSlide";

const deckId="1pLBZx1olhefO_lGhEkecRSW3yQTXhoJgZ5achnxvLD0";

type Counts={totals:{participants:number;fingerprints:number;products:number};distribution:Record<string,number>};
export default function ExactWorkshopPresentation(){
 const params=useParams<{code:string}>();
 const code=String(params.code??"").toUpperCase();
 const db=useMemo(()=>getSupabaseBrowserClient(),[]);
 const [selectedTool,setSelectedTool]=useState<"none"|"asloobi"|"kwlr"|"planner">("none");
 const [synced,setSynced]=useState(true);
 const [page,setPage]=useState(1);
 const [pageReady,setPageReady]=useState(false);
 const [session,setSession]=useState<any>(null);
 const [stats,setStats]=useState<Counts|null>(null);
 const [qr,setQr]=useState("");
 const [kwlrQr,setKwlrQr]=useState("");
 const [showKwlrJoin,setShowKwlrJoin]=useState(false);
 const [authorized,setAuthorized]=useState(false);
 const [trainerVerified,setTrainerVerified]=useState(false);
 const [embedLoaded,setEmbedLoaded]=useState(false);
 const [showControls,setShowControls]=useState(false);
 const [activity,setActivity]=useState<"none"|"join"|"results">("none");
 const [notice,setNotice]=useState("");
 const [refreshTime,setRefreshTime]=useState("");
 const [loading,setLoading]=useState(false);
 const [kwlrResults,setKwlrResults]=useState<any>(null);
 const kwlrRequest=useRef(0);
 const activePageRef=useRef(page);
 activePageRef.current=page;
 const [showKwlrResults,setShowKwlrResults]=useState(false);
 const joinUrl=typeof window!=="undefined"?location.origin+"/w/"+code:"";
 // Google Slides is the only visual slide renderer. Its native player owns slide navigation.
 // An embedded cross-origin player cannot reliably report its active slide to this app.
 const deckUrl="https://docs.google.com/presentation/d/"+deckId+"/edit";
 const slideUrl="https://docs.google.com/presentation/d/"+deckId+"/embed?start=false&loop=false&delayms=600000";
 const activeTool=synced?(pageReady?(page===11?"asloobi":page>=16&&page<=18?"kwlr":page>=25&&page<=37?"planner":"none"):"none"):selectedTool;
 const isActivityPage=activeTool==="asloobi";
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
 useEffect(()=>{if(!code)return;void QRCode.toDataURL(location.origin+"/w/"+code,{width:460,margin:1}).then(setQr).catch(()=>{});void QRCode.toDataURL(location.origin+"/w/"+code+"/kwlr",{width:460,margin:1}).then(setKwlrQr).catch(()=>{});},[code]);
 useEffect(()=>{void db.auth.getUser().then(x=>setAuthorized(Boolean(x.data.user)));const {data}=db.auth.onAuthStateChange((_e,x)=>setAuthorized(Boolean(x?.user)));return()=>data.subscription.unsubscribe()},[db]);
 // Do not intercept arrow keys or claim that local state tracks Google's embedded player.
 useEffect(()=>{if(synced)setPageReady(false)},[synced,page]);
 // The canonical Google Slides PDF snapshot is verified (38 pages) and provides one reliable slide identity on every device.
 useEffect(()=>{if(!isActivityPage)setActivity("none")},[isActivityPage]);
 useEffect(()=>{if(!synced||!pageReady||page<16||page>18){kwlrRequest.current+=1;setShowKwlrResults(false);setShowKwlrJoin(false);setKwlrResults(null)}},[synced,page,pageReady]);
 useEffect(()=>{if(!authorized||!code){kwlrRequest.current+=1;setTrainerVerified(false);setShowKwlrResults(false);setKwlrResults(null);return}let live=true;db.functions.invoke("workshop-public",{body:{action:"kwlr_state",code,trainer_view:true}}).then(({data,error})=>{if(live){const allowed=!error&&!data?.error;setTrainerVerified(allowed);if(!allowed){setShowKwlrResults(false);setKwlrResults(null)}}}).catch(()=>{if(live){setTrainerVerified(false);setShowKwlrResults(false);setKwlrResults(null)}});return()=>{live=false}},[authorized,code,db]);
 async function fetchKwlrResults(){
  if(!trainerVerified||!session?.id){setNotice("النتائج متاحة للمدرب المصرح له فقط.");return}
  const requestId=++kwlrRequest.current;
  const requestedPage=activePageRef.current;
  const {data,error}=await db.functions.invoke("workshop-public",{body:{action:"kwlr_state",code,trainer_view:true}});
  if(requestId!==kwlrRequest.current||requestedPage!==activePageRef.current)return;
  if(error||data?.error){setKwlrResults(null);setShowKwlrResults(false);setNotice("تعذر جلب نتائج KWLR المصرح بها لهذه الجلسة.");return}
  setKwlrResults(data);setShowKwlrResults(true);setNotice("");
 }
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
    {synced?<SnapshotPdfSlide page={page} onReady={()=>setPageReady(true)} onFailure={()=>{setSynced(false);setPageReady(false);setNotice("تعذر تشغيل عارض الشرائح المصدرة من Google Slides؛ انتقلنا إلى مشغل Google الأصلي حفاظًا على المحتوى.")}}/>:<iframe className="exactDeckIframe" src={slideUrl} onLoad={()=>setEmbedLoaded(true)} title="العرض الأصلي في Google Slides — التنقل داخل العرض من Google" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
    {showKwlrJoin&&synced&&pageReady&&page>=16&&page<=18&&<div className="exactActivityLayer" role="dialog" aria-label="الدخول إلى نشاط KWLR"><button className="exactClose" onClick={()=>setShowKwlrJoin(false)} aria-label="إغلاق">×</button><h2>نشاط KWLR — {code}</h2><p>يمسح المتدرب الرمز بعد الانضمام إلى جلسة الورشة.</p><div className="exactJoinCard">{kwlrQr&&<img src={kwlrQr} alt="رمز النشاط الخاص بجلسة KWLR الحالية"/>}<div><strong>{code}</strong><span>{typeof window!=="undefined"?location.origin+"/w/"+code+"/kwlr":""}</span><p>يتحكم المدرب بفتح المراحل K وW وL من صفحة الإدارة.</p><a href={session?.id?"/admin/workshops/"+session.id+"/kwlr":"#"} target="_blank" rel="noreferrer">لوحة إدارة النشاط</a></div></div><button className="exactPrimary" onClick={()=>{setShowKwlrJoin(false);void fetchKwlrResults()}}>نتائج الاستجابات</button></div>}
    {showKwlrResults&&synced&&pageReady&&page>=16&&page<=18&&<div className="exactActivityLayer" role="dialog" aria-label="النتائج المجمعة لنشاط KWLR"><button className="exactClose" onClick={()=>setShowKwlrResults(false)} aria-label="إغلاق نتائج KWLR">×</button><h2>استجابات KWLR — {code}</h2><p>إجمالي الاستجابات الموثقة: {Object.values(kwlrResults?.counts??{}).reduce((s:number,v:any)=>s+Number(v),0)}</p><p>الأسئلة المطروحة: {kwlrResults?.kwlr_progress?.questions??"—"} • المرتبطة بإجابات تعلم: {kwlrResults?.kwlr_progress?.linked_answered_questions??"—"} • غير المرتبطة: {kwlrResults?.kwlr_progress?.unlinked_questions??"—"}</p><p style={{fontSize:13}}>الارتباط بإجابة لا يُعد تصحيحًا علميًا تلقائيًا.</p><div style={{display:"flex",gap:12,flexWrap:"wrap",maxHeight:"65%",overflow:"auto"}}>{[1,2,3].map(stage=><section key={stage} style={{flex:"1 1 230px",background:"#eef8fb",padding:14,borderRadius:12}}><h3>{stage===1?"ماذا تعرف؟":stage===2?"ماذا تريد أن تعرف؟":"ماذا تعلمت؟"} ({kwlrResults?.counts?.[stage]??0})</h3>{(kwlrResults?.entries??[]).filter((x:any)=>x.stage===stage).map((x:any)=><p key={x.id} style={{fontSize:14,borderBottom:"1px solid #d4e1ea"}}>{x.response_text}</p>)}</section>)}</div><button className="exactPrimary" onClick={()=>void fetchKwlrResults()}>تحديث النتائج</button></div>}
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
   <nav className="exactDeckBar" aria-label="أدوات المدرب — تنقل الشرائح داخل Google Slides">
     <span>{synced?("Google Slides (نسخة عرض موحدة) • الشريحة "+page+" / 38"+(pageReady?"":" • تحميل")):(embedLoaded?"عرض Google Slides الأصلي • التنقل من أدوات Google":"تحميل Google Slides…")}</span>
     {synced&&<button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1||!pageReady}>السابق</button>}
     {synced&&<button onClick={()=>setPage(p=>Math.min(38,p+1))} disabled={page>=38||!pageReady}>التالي</button>}
     {synced&&<select aria-label="انتقال مباشر للشريحة" disabled={!pageReady} value={page} onChange={e=>setPage(Number(e.target.value))}>{Array.from({length:38},(_,i)=><option key={i+1} value={i+1}>الشريحة {i+1}</option>)}</select>}
     <button onClick={()=>setShowControls(v=>!v)}>أدوات الأنشطة</button>
     <button onClick={()=>void document.documentElement.requestFullscreen?.().catch(()=>{})}>ملء الشاشة</button>
     {synced&&pageReady&&page>=16&&page<=18&&<button className="exactPrimary" onClick={()=>{setShowKwlrResults(false);setShowKwlrJoin(true)}}>عرض QR لنشاط KWLR</button>}
     {synced&&pageReady&&page>=16&&page<=18&&trainerVerified&&<button onClick={()=>{setShowKwlrJoin(false);void fetchKwlrResults()}}>نتائج KWLR</button>}
     {isActivityPage&&authorized&&<button className="exactPrimary" onClick={()=>void startAsloobi()} disabled={loading}>بدء أسلوبي وعرض QR</button>}
     {isActivityPage&&authorized&&<button onClick={()=>setActivity("results")} disabled={!stats}>نتائج أسلوبي</button>}
   </nav>
   {showControls&&<aside className="exactDeckControls">
      <b>أدوات المدرب — جلسة {code}</b>
      <small>{synced?"التنقل مرتبط بصفحة محددة من Google Slides؛ تظهر أدوات الأنشطة بحسب رقم الصفحة.":"في مشغل Google المضمّن، النشاط يدوي ولا يمكن ضمان رقم الصفحة النشطة."}</small>
      {!synced&&<button onClick={()=>{setSelectedTool("asloobi");setActivity("none");setShowControls(false)}}>نشاط أسلوبي (الصفحة الأصلية 11)</button>}
      {!synced&&<button onClick={()=>{setSelectedTool("kwlr");setActivity("none");setShowControls(false)}}>نشاط KWLR (الصفحات 16–18)</button>}
      {!synced&&<button onClick={()=>{setSelectedTool("planner");setActivity("none");setShowControls(false)}}>تخطيط الوحدة (الصفحات 25–37)</button>}
      <button onClick={()=>{setSelectedTool("none");setActivity("none");setShowControls(false)}}>إنهاء وضع النشاط والعودة للعرض</button>
      {activeTool==="kwlr"&&session?.id&&<a href={"/admin/workshops/"+session.id+"/kwlr"} target="_blank" rel="noreferrer">فتح إدارة KWLR</a>}
      {activeTool==="planner"&&<a href="/admin/training/bloom-planner" target="_blank" rel="noreferrer">فتح مخطط بلوم</a>}
      {isActivityPage&&activity!=="none"&&<span>المتدربون: {total??"—"} • أتموا: {completed??"—"} • آخر تحديث: {refreshTime||"—"}</span>}
      <a href={deckUrl} target="_blank" rel="noreferrer">تحرير العرض الأصلي في Google Slides</a>
      <a href={session?.id?"/admin/workshops/"+session.id:"/trainer"} target="_blank" rel="noreferrer">إدارة الورشة</a>
      <button onClick={()=>setShowControls(false)}>إغلاق</button>
   </aside>}
    {notice&&<p role="status" className="exactDeckNotice">{notice}</p>}
 </main>;
}
