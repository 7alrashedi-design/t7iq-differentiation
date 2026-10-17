"use client";
import {useEffect,useMemo,useState} from "react";
import QRCode from "qrcode";
import {createClient} from "@supabase/supabase-js";
import {ChevronLeft,ChevronRight,Maximize,Minimize,RefreshCw,ExternalLink,LockKeyhole} from "lucide-react";
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const content:Array<[string,string,string]>=[["غلاف الورشة","الخطوة الأولى للتمايز بصفوف الموهوبين","intro"],["افتتاح","تهيئة المشاركين وأهداف اللقاء","intro"],["أهداف الورشة","استخدام أساليب متنوعة لدعم التعلم المستمر؛ تخطيط وحدات للمواهب الأكاديمية","intro"],["محاور الورشة","التنوع داخل صفوف الموهوبين • التمايز • بلوم المعدل • منتجات التعلم وتقييمها","intro"],["قبل التخطيط","لماذا نحتاج إلى معرفة المتعلم قبل تخطيط التجربة؟","one"],["مهمة تربوية (1)","أسلوبي: مقياس التعبير عن المنتج","one"],["مقياس أسلوبي","يبدأ بعد إذن المدرب؛ أجب عن العبارات الخمسين كاملة","one"],["مراجعة الاستجابات","اختر درجة الاهتمام لكل عبارة من 1 إلى 5، دون إجابة مثالية","one"],["تحليل البصمة","اقرأ ترتيب الأبعاد وتفسيرها؛ لا تعتبرها حكمًا ثابتًا على قدراتك","one"],["جدول المنتجات","استخدم شفرتك لاستكشاف منتجات كتابية وشفهية ومرئية وتقنية وحركية","two"],["التمـايز","من التقييم إلى خيارات مختلفة تخدم هدف تعلم واحد","two"],["تعريف التمايز","مواءمة المناهج وخبرات التعلم بمستويات المتعلمين","two"],["دور المعلم","يوائم عمق المحتوى والعمليات المعرفية والمنتج والتقييم","two"],["الغرض من التمايز","تيسير إحراز جميع الطلبة تقدمًا مستمرًا","two"],["الهدف طويل المدى","تكوين متعلمين يواصلون طلب العلم طوال الحياة","two"],["معادلة تجربة التعلم","المحتوى + العمليات + المنتج = تجربة تعلم متمايزة","two"],["الأسئلة الثلاثة","ماذا ينبغي أن يتعلم الطالب؟ من يمتلك المعرفة مسبقًا؟ كيف أحقق تقدمه؟","two"],["ملاحظات مهمة","نموذج المقاس الواحد لا يستجيب لجميع الاحتياجات؛ التقويم ملازم للتمايز","two"],["الخطوة الأولى للتخطيط","تخطيط تجارب التعلم بناء على معرفة المتعلم","three"],["التخطيط لتجارب التعلم","بعد التقييم القبلي تُستخدم أدلة التعلم لإعادة تصميم الوحدة","three"],["بلوم المعدل","إطار لتنويع عمق العمليات المعرفية","three"],["ما تصنيف بلوم؟","أتذكر • أفهم • أطبق • أحلل • أقيّم • أبدع","three"],["أبعاد العملية المعرفية","انتقل من استرجاع المعلومات إلى تبريرها وإنتاج حلول جديدة","three"],["الطريقة الأولى داخل الصف","أنشطة متدرجة ومسارات مرنة داخل الدرس الواحد","three"],["الطريقة الثانية: مراكز التعلم","تنظيم محطات مختلفة بما يناسب الهدف وأدلة الجاهزية","three"],["مثال تخطيط: الكسور","تدرج العملية والمحتوى والمنتج في الرياضيات","three"],["مثال: نظرية فيثاغورس","خطة وحدة رياضية تشمل العمليات الست ومستويات تفكير متعددة","three"],["مثال: الفنون البصرية","تخطيط يربط المحتوى الفني بعمليات التفكير والمنتج","three"],["مهمة تربوية (2)","ابدأ إعداد وحدة متمايزة باستخدام الجدول المرجعي","three"],["نموذج التخطيط","حدد المادة والموضوع والحصص؛ ثم أكمل العملية والمحتوى والمنتج","three"],["مساعد (1): أفعال بلوم","استخدم أفعالًا قابلة للملاحظة والتقويم في أهدافك","three"],["مساعد (2): المنتجات","اختر المنتج الذي يثبت التعلم لا الذي يبدو أكثر جاذبية","three"],["استفسارات التخطيط","اسأل قبل التخطيط وبعده عن المحتوى والعملية والمنتج","three"],["تقييم منتجات التعلم","التقييم البنائي يدعم تعديل المنتج أثناء إنجازه","two"],["تعريف المنتج","وسيلة لتوصيل المعلومات أو إظهار المهارات لجمهور محدد","two"],["فئات المنتجات","الكتابي • الشفهي • الفني/المرئي • التقني • الحركي","two"],["أمثلة بحسب الأسلوب","تقرير • عرض شفهي • ملصق • تطبيق • نموذج أو تجربة","two"],["التقويم البنائي","ملاحظات محددة تساعد المتعلم على التحسين قبل التسليم","two"],["مكونات تقييم المنتج","المحتوى • العرض • الإبداع • التأمل والأثر بحسب أداة المنتج","two"],["دراسة بحثية: التصنيف الثاني","قائمة معايير تفصيلية للمحتوى والعرض والإبداع","two"],["دراسة بحثية: التصنيف الثالث","معايير أعمق تتناسب مع درجة تعقيد المنتج","two"],["الاختراع: التصنيف الأول","جودة الفكرة ودقة المحتوى وقابلية العرض","two"],["الاختراع: التصنيف الثالث","عمق التطوير والتوثيق والتأمل في الأثر","two"],["مشروع التعلم الخدمي (1)","معايير المنتج المرتبط بخدمة المجتمع","two"],["مشروع التعلم الخدمي (3)","تطوير أثر المشروع وتوثيق الأدلة والتعلم","two"],["بيئة التعلم","المناخ الصفي شرط داعم لممارسة التمايز","outro"],["تهيئة البيئة التعلمية","الاتجاهات الإيجابية والدعم واحترام التنوع","outro"],["مهمة تربوية (4)","صمم تعديلًا في مناخ صفك يدعم التمايز","outro"],["الختام والمراجعة","تحقق من المخرجات وحدد خطوة تطبيقية في صفك","outro"]];
const labels:Record<string,string>={intro:"الافتتاح",one:"المرحلة الأولى · أسلوبي",two:"المرحلة الثانية · المنتج والتقويم",three:"المرحلة الثالثة · التخطيط",outro:"الإغلاق"};
const colors:Record<string,string>={intro:"#127F88",one:"#2875C7",two:"#E28A26",three:"#2B9B66",outro:"#A650C7"};
export default function InteractiveWorkshop({params}:{params:Promise<{code:string}>}){
 const [code,setCode]=useState("");const [session,setSession]=useState<any>(null);const [stats,setStats]=useState<any>(null);
 const [slide,setSlide]=useState(0);const [qr,setQr]=useState("");const [controls,setControls]=useState(false);const [isFullscreen,setIsFullscreen]=useState(false);const [error,setError]=useState("");const [updated,setUpdated]=useState("");
 useEffect(()=>{params.then(p=>setCode(p.code.toUpperCase()))},[params]);
 useEffect(()=>{if(!code)return;QRCode.toDataURL(location.origin+"/w/"+code,{width:400,margin:1}).then(setQr).catch(()=>{});},[code]);
 useEffect(()=>{if(!code)return;let alive=true;async function poll(){
   const {data,error:e}=await supabase.functions.invoke("workshop-public",{body:{action:"session",code}});
   if(alive){if(e||data?.error){setError("تعذر التحقق من جلسة الورشة");}else{setSession(data.session);setError("");setUpdated(new Date().toLocaleTimeString("ar-SA"));}}
   if(data?.session?.settings?.test_mode===true){const res=await supabase.functions.invoke("workshop-public",{body:{action:"demo_summary",code}});if(alive&&res.data&&!res.data.error)setStats(res.data)}
 }
 void poll();const timer=setInterval(()=>void poll(),6000);return()=>{alive=false;clearInterval(timer)}},[code]);
 const phase=session?.settings?.trainer_controlled_phases===true?Number(session.settings.active_phase??0):3;
 const item=content[slide];const phaseId=item[2]==="one"?1:item[2]==="two"?2:item[2]==="three"?3:0;
 const locked=phaseId>phase;

 function go(n:number){setSlide(Math.max(0,Math.min(content.length-1,n)))}
 function fullscreen(){if(document.fullscreenElement){void document.exitFullscreen?.();}else{void document.documentElement.requestFullscreen?.().catch(()=>{})}}
 useEffect(()=>{const sync=()=>setIsFullscreen(Boolean(document.fullscreenElement));document.addEventListener("fullscreenchange",sync);return()=>document.removeEventListener("fullscreenchange",sync)},[]);
 useEffect(()=>{const handle=(e:KeyboardEvent)=>{if(e.key==="ArrowLeft")setSlide(s=>Math.min(s+1,content.length-1));if(e.key==="ArrowRight")setSlide(s=>Math.max(s-1,0));if(e.key.toLowerCase()==="f")fullscreen()};window.addEventListener("keydown",handle);return()=>window.removeEventListener("keydown",handle)},[]);
 const categoryCounts=useMemo(()=>Object.entries(stats?.distribution??{}),[stats]);
 const link=typeof window!=="undefined"?location.origin+"/w/"+code:"";
 const trainerLink=session?.id?`/trainer/session/${session.id}`:"/trainer";
 
 return <main className="interactiveWorkshop presenterStage" dir="rtl">
  <section className="presenterCanvas" style={{["--phase-color" as string]:colors[item[2]]}}>
   <div className="presenterTopline"><span>منصة التمايز | الخطوة الأولى للتمايز بصفوف الموهوبين</span><span>{labels[item[2]]}</span></div>
   <div className="presenterContent">
     <div className="presenterEyebrow">المحطة {slide+1} من {content.length}</div>
     <h1>{item[0]}</h1>
     <p>{item[1]}</p>
     {locked&&<div className="presenterLock"><LockKeyhole size={22}/> لم يأذن المدرب ببدء هذا التطبيق بعد</div>}
     {(slide===6||slide===8||slide===9)&&<div className="presenterActivity">
       {qr&&<img src={qr} alt="رمز QR لدخول المتدربين" className="presenterQr"/>}
       <div><strong>الدخول إلى نشاط الورشة</strong><span>{link}</span><a href={link} target="_blank" rel="noreferrer">فتح نشاط المتدرب <ExternalLink size={16}/></a></div>
     </div>}
     {slide===8&&stats&&<div className="presenterStats"><h2>نتائج المجموعة</h2>{categoryCounts.map(([k,v])=><div key={k}><strong>{k}</strong><progress value={Number(v)} max={Math.max(1,...categoryCounts.map(x=>Number(x[1])))} /><b>{String(v)}</b></div>)}</div>}
     {slide===8&&!stats&&<div className="presenterNotice">افتح لوحة المدرب لعرض إحصاءات الجلسة المتاحة. لا تُعرض نتائج افتراضية.</div>}
     {error&&<div className="presenterNotice" role="alert">{error} — تعذر التحقق من البيانات المباشرة.</div>}
   </div>
   <footer className="presenterBottom"><span>{session?.title??"ورشة التمايز"}</span><span>{slide+1} / {content.length}</span></footer>
   <div className="presenterProgress" style={{width:`${(slide+1)/content.length*100}%`}}/>
  </section>
  <nav className="presenterToolbar" aria-label="أدوات العرض">
    <button onClick={()=>go(slide-1)} disabled={slide===0} title="السابق"><ChevronRight size={22}/></button>
    <button onClick={()=>go(slide+1)} disabled={slide===content.length-1} title="التالي"><ChevronLeft size={22}/></button>
    <button onClick={fullscreen} title="ملء الشاشة">{isFullscreen?<Minimize size={22}/>:<Maximize size={22}/>}</button>
    <button onClick={()=>setControls(v=>!v)} title="لوحة المدرب">{controls?"إخفاء الأدوات":"إدارة العرض"}</button>
  </nav>
  {controls&&<aside className="presenterControls">
   <header><b>أدوات المدرب</b><button onClick={()=>setControls(false)}>إغلاق</button></header>
   <p>رمز الجلسة: {code} • حالة المرحلة: {phase===0?"انتظار":phase}</p>
   <p>تتحكم لوحة المدرب وحدها في فتح المراحل للمتدربين.</p>
   {["الافتتاح","أسلوبي","المنتج والتقويم","التخطيط","الختام"].map((v,i)=><button key={v} onClick={()=>{go(i===0?0:i===1?content.findIndex(x=>x[2]==="one"):i===2?content.findIndex(x=>x[2]==="two"):i===3?content.findIndex(x=>x[2]==="three"):content.findIndex(x=>x[2]==="outro"));setControls(false)}}>{v}</button>)}
   <a href={trainerLink} target="_blank" rel="noreferrer">لوحة المدرب <ExternalLink size={15}/></a>
   <small>آخر تحديث: {updated||"غير متاح"}</small>
  </aside>}
 </main>
}
