"use client";
import {useCallback,useEffect,useState} from "react";
import {useParams} from "next/navigation";
import QRCode from "qrcode";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";
import {cairoDeck} from "@/lib/workshop/cairoDeck";
import "./cairo.css";
type Stats={totals:{participants:number;fingerprints:number;products:number;completed_products:number;completed_workshop:number};distribution:Record<string,number>;levels:Record<string,number>};
type Mode="slide"|"activity"|"results";
const labels:{[key:string]:string}={W:"كتابي",O:"شفهي",V:"فني",K:"حركي",T:"تقني"};
const hues:{[key:string]:string}={W:"#2585c7",O:"#e28a26",V:"#a650c7",K:"#2d9b66",T:"#d44f70"};
export default function InteractiveWorkshop(){
 const params=useParams<{code:string}>(),code=String(params.code??"").toUpperCase();
 const db=getSupabaseBrowserClient();
 const [session,setSession]=useState<any>(null),[stats,setStats]=useState<Stats|null>(null),[qr,setQr]=useState("");
 const [page,setPage]=useState(0),[panel,setPanel]=useState(false),[auth,setAuth]=useState(false);
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState({title:"",body:"",accent:"#3485c2",scale:"normal"});
 const [status,setStatus]=useState(""),[last,setLast]=useState(""),[busy,setBusy]=useState(false);
 const current=cairoDeck[page]??cairoDeck[0],override=session?.settings?.presenter_slides?.[String(page)]??{};
 const title=typeof override.title==="string"&&override.title.trim()?override.title:current[0];
 const body=typeof override.body==="string"&&override.body.trim()?override.body:current[1];
 const accent=typeof override.accent==="string"?override.accent:"#3485c2";
 const scale=override.scale==="large"?"large":"normal";
 const activePhase=session?.settings?.trainer_controlled_phases===true?Number(session.settings.active_phase??0):3;
 const kind=current[2],required=kind==="style"?1:kind==="assessment"?2:kind==="planning"||kind==="table"||kind==="bloom"?3:0;
 const mode:Mode=session?.settings?.presenter_mode==="results"?"results":session?.settings?.presenter_mode==="activity"?"activity":"slide";
 const joinUrl=typeof window!=="undefined"?location.origin+"/w/"+code:"";
 const refresh=useCallback(async()=>{
  if(!code)return;
  try{
   const [a,b]=await Promise.all([
    db.functions.invoke("workshop-public",{body:{action:"session",code}}),
    db.functions.invoke("workshop-public",{body:{action:"live_summary",code}})
   ]);
   if(a.error||!a.data?.session)throw Error("تعذر تحميل الجلسة");
   setSession(a.data.session);
   if(!b.error&&b.data?.totals)setStats(b.data as Stats);
   else setStatus("تعذّر تحديث أعداد المتدربين.");
   setLast(new Date().toLocaleTimeString("ar-SA"));
  }catch{setStatus("تعذر الاتصال بالخادم؛ قد تكون البيانات المعروضة غير محدثة.")}
 },[code,db]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),4000);return()=>clearInterval(timer)},[refresh]);
 useEffect(()=>{if(!code)return;QRCode.toDataURL(location.origin+"/w/"+code,{width:500,margin:1}).then(setQr).catch(()=>{})},[code]);
 useEffect(()=>{void db.auth.getUser().then(({data})=>setAuth(Boolean(data.user)));const {data}=db.auth.onAuthStateChange((_event,s)=>setAuth(Boolean(s?.user)));return()=>data.subscription.unsubscribe()},[db]);
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest("input,textarea,select,[contenteditable]"))return;if(e.key==="ArrowLeft")setPage(p=>Math.min(43,p+1));if(e.key==="ArrowRight")setPage(p=>Math.max(0,p-1));if(e.key.toLowerCase()==="f")void document.documentElement.requestFullscreen?.().catch(()=>{})};window.addEventListener("keydown",f);return()=>window.removeEventListener("keydown",f)},[]);
 function edit(){if(!auth){setStatus("سجّل الدخول بحساب المدرب قبل التحرير.");return}setDraft({title,body,accent,scale});setEditing(true);setPanel(false)}
 async function updateSettings(change:Record<string,unknown>){
  if(!session?.id||!auth){setStatus("يلزم تسجيل الدخول بحساب مخول لإدارة الورشة.");return false}
  setBusy(true);
  const settings={...(session.settings??{}),...change};
  const {data,error}=await db.from("workshop_sessions").update({settings}).eq("id",session.id).select("id").maybeSingle();
  setBusy(false);
  if(error||!data){setStatus("تعذر حفظ الأمر؛ تحقق من صلاحية حساب المدرب.");return false}
  setSession({...session,settings});setStatus("");return true;
 }
 async function save(){const entries={...(session?.settings?.presenter_slides??{}),[String(page)]:draft};if(await updateSettings({presenter_slides:entries}))setEditing(false)}
 async function startActivity(){
  if(required===0){await updateSettings({presenter_mode:"activity"});return}
  if(session?.settings?.trainer_controlled_phases!==true){setStatus("فعّل التحكم المرحلي من لوحة إدارة الورشة أولًا.");return}
  if(required>activePhase+1){setStatus("يجب فتح المراحل التعليمية بالترتيب.");return}
  await updateSettings({presenter_mode:"activity",active_phase:Math.max(activePhase,required)});
 }
 const total=stats?.totals.participants??0,finished=kind==="style"?stats?.totals.fingerprints??0:kind==="assessment"?stats?.totals.products??0:stats?.totals.completed_workshop??0;
 const resultsKind=kind==="style"?"بصمات أسلوبي":kind==="assessment"?"تقييم المنتجات":"مخرجات الورشة";
 return <main className="cairoShell kahootRoom" dir="rtl">
 <div className="kahootFrame">
 <section className="cairoStage kahootMain" style={{["--local-accent" as string]:accent}}>
 <div className="cairoTopAngle"/><div className="cairoLimeAngle"/>
 <header className="cairoHead"><span>الخطوة الأولى للتمايز بصفوف الموهوبين</span><span className="kahootLiveTag">جلسة {code}</span></header>
 <article className={"cairoBody kahootBody "+(scale==="large"?"kahootLarge":"")}>
 <small>المحطة {page+1} من 44 • {session?.title??"الورشة التفاعلية"}</small>
 {mode==="activity"?<>
 <h1>حان وقت المشاركة</h1><p>{kind==="style"?"ابدأ مقياس أسلوبي وأكمل جميع العبارات الخمسين.":kind==="assessment"?"اختر منتجك وابدأ تقييمه.":"نفّذ المهمة التعليمية مع مجموعتك."}</p>
 <div className="kahootJoin">
 {qr&&<img src={qr} alt="امسح الرمز لدخول نشاط الجلسة الحالية"/>}
 <div><strong>امسح الرمز وشارك الآن</strong><code>{joinUrl}</code><span>رمز الجلسة: {code}</span></div>
 </div>
 </>:mode==="results"?<>
 <h1>نتائج {resultsKind}</h1>
 <p className="kahootSummary">نتائج مجمّعة تخص جلسة {code} فقط</p>
 <div className="kahootMetrics"><div><b>{total}</b><span>المشاركون</span></div><div><b>{finished}</b><span>المنجزون</span></div><div><b>{Math.max(0,total-finished)}</b><span>لم ينجزوا بعد</span></div></div>
 {kind==="style"&&<div className="kahootDistribution">{Object.entries(stats?.distribution??{}).map(([key,value])=><div key={key}><span>{labels[key]??key}</span><div><i style={{width:`${total?value/total*100:0}%`,background:hues[key]??"#3385bd"}}/></div><b>{value}</b></div>)}</div>}
 {kind==="assessment"&&<div className="kahootDistribution">{Object.entries(stats?.levels??{}).map(([key,value])=><div key={key}><span>{key}</span><div><i style={{width:`${total?value/total*100:0}%`}}/></div><b>{value}</b></div>)}</div>}
 {!stats&&<div className="cairoAlert">الإحصاءات غير متاحة مؤقتًا. لا توجد أرقام افتراضية.</div>}
 </>:<>
 <div className="kahootSlideContent" onClick={auth?edit:undefined} role={auth?"button":undefined} tabIndex={auth?0:undefined} onKeyDown={e=>{if(auth&&(e.key==="Enter"||e.key===" "))edit()}}>
 <h1>{title}</h1><p>{body}</p></div>
 {kind==="formula"&&<div className="cairoFormula">{["المحتوى","+","العملية","+","المنتج","=","تجربة تعلم"].map((x,i)=><span key={i}>{x}</span>)}</div>}
 {kind==="bloom"&&<div className="cairoBloom">{["أتذكر","أفهم","أطبق","أحلل","أقيم","أبدع"].map((x,i)=><span key={i} style={{background:["#d7e800","#54c9d5","#3bb0df","#388acb","#2870ae","#194f7f"][i]}}>{x}</span>)}</div>}
 {kind==="table"&&<div className="cairoMatrix"><b>العملية</b><b>المحتوى</b><b>المنتج</b>{["أتذكر","أفهم","أطبق","أحلل","أقيم","أبدع"].map((x,i)=><div key={x} className="cairoMatrixRow"><span>{x}</span><span>{page===19?"فيثاغورس":"الكسور"}</span><span>{["مثال","رسم","شرح","بحث","تبرير","تصميم"][i]}</span></div>)}</div>}
 </>}
 {mode==="slide"&&required>activePhase&&<div className="cairoAlert">هذه المرحلة لم يفتحها المدرب بعد.</div>}
 {status&&<div className="cairoAlert" role="status">{status}</div>}
 </article>
 <footer className="cairoFoot"><span>مستند إلى عرض د. محمد رواس ود. جوليا روبرتس • القاهرة 2021</span><b>{page+1}</b></footer>
 </section>
 <aside className="kahootRight" aria-label="متابعة الجلسة الحالية">
 <div className="kahootRightTitle">إحصاءات الجلسة <span className="kahootPulse"/></div>
 <p>{session?.title??"جارٍ تحميل الجلسة"}</p>
 <div className="kahootStat"><b>{total}</b><span>متدرب في هذه الجلسة</span></div>
 <div className="kahootStat"><b>{stats?.totals.fingerprints??0}</b><span>أكملوا أسلوبي</span></div>
 <div className="kahootStat"><b>{stats?.totals.products??0}</b><span>اختاروا المنتج</span></div>
 <div className="kahootStat"><b>{stats?.totals.completed_workshop??0}</b><span>أكملوا الورشة</span></div>
 <small>آخر تحديث: {last||"بانتظار الاتصال"}</small>
 <div className="kahootActions">
 <button onClick={()=>void startActivity()} disabled={busy||!auth}>بدء النشاط وعرض QR</button>
 <button onClick={()=>void updateSettings({presenter_mode:"results"})} disabled={busy||!auth}>إنهاء العرض وإظهار النتائج</button>
 <button onClick={()=>void updateSettings({presenter_mode:"slide"})} disabled={busy||!auth}>العودة إلى الشريحة</button>
 </div>
 <div className="kahootControlNotice">{auth?"أوامر المدرب محمية بصلاحيات حساب الورشة.":"لإدارة الأنشطة، افتح العرض وأنت مسجل دخولك بحساب المدرب."}</div>
 </aside></div>
 <nav className="cairoBar kahootNav"><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={!page}>السابق</button><button onClick={()=>setPage(p=>Math.min(43,p+1))} disabled={page===43}>التالي</button><button onClick={()=>void document.documentElement.requestFullscreen?.().catch(()=>{})}>ملء الشاشة</button><button onClick={()=>setPanel(p=>!p)}>الشرائح / التحرير</button></nav>
 {panel&&<aside className="cairoPanel kahootPanel"><h2>الشرائح وإدارة الورشة</h2><button onClick={edit} disabled={!auth}>تحرير الشريحة الحالية</button><div className="kahootSlides">{cairoDeck.map((row,i)=><button key={i} onClick={()=>{setPage(i);setPanel(false)}} className={page===i?"selected":""}>{i+1}. {row[0]}</button>)}</div><a href={session?.id?"/admin/workshops/"+session.id:"/trainer"} target="_blank">إدارة الجلسة</a><button onClick={()=>setPanel(false)}>إغلاق</button></aside>}
 {editing&&<div className="kahootBackdrop"><section className="kahootEditDialog" role="dialog" aria-modal="true" aria-label="تحرير الشريحة"><h2>تحرير الشريحة {page+1} مباشرة</h2>
 <label>العنوان<input value={draft.title} onChange={e=>setDraft(v=>({...v,title:e.target.value}))}/></label>
 <label>النص<textarea rows={5} value={draft.body} onChange={e=>setDraft(v=>({...v,body:e.target.value}))}/></label>
 <label>لون الهوية<input type="color" value={draft.accent} onChange={e=>setDraft(v=>({...v,accent:e.target.value}))}/></label>
 <label>حجم النص<select value={draft.scale} onChange={e=>setDraft(v=>({...v,scale:e.target.value}))}><option value="normal">عادي</option><option value="large">كبير</option></select></label>
 <div><button disabled={busy} onClick={()=>void save()}>حفظ التعديلات</button><button onClick={()=>setEditing(false)}>إلغاء</button></div></section></div>}
 </main>
}
