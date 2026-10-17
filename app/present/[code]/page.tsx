"use client";
import {useEffect,useMemo,useState} from "react";
import QRCode from "qrcode";
import {createClient} from "@supabase/supabase-js";
import {ChevronLeft,ChevronRight,Maximize,RefreshCw,ExternalLink,LockKeyhole} from "lucide-react";
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const content:Array<[string,string,string]>=[["غلاف الورشة","الخطوة الأولى للتمايز بصفوف الموهوبين","intro"],["افتتاح","تهيئة المشاركين وأهداف اللقاء","intro"],["أهداف الورشة","استخدام أساليب متنوعة لدعم التعلم المستمر؛ تخطيط وحدات للمواهب الأكاديمية","intro"],["محاور الورشة","التنوع داخل صفوف الموهوبين • التمايز • بلوم المعدل • منتجات التعلم وتقييمها","intro"],["قبل التخطيط","لماذا نحتاج إلى معرفة المتعلم قبل تخطيط التجربة؟","one"],["مهمة تربوية (1)","أسلوبي: مقياس التعبير عن المنتج","one"],["مقياس أسلوبي","يبدأ بعد إذن المدرب؛ أجب عن العبارات الخمسين كاملة","one"],["مراجعة الاستجابات","اختر درجة الاهتمام لكل عبارة من 1 إلى 5، دون إجابة مثالية","one"],["تحليل البصمة","اقرأ ترتيب الأبعاد وتفسيرها؛ لا تعتبرها حكمًا ثابتًا على قدراتك","one"],["جدول المنتجات","استخدم شفرتك لاستكشاف منتجات كتابية وشفهية ومرئية وتقنية وحركية","two"],["التمـايز","من التقييم إلى خيارات مختلفة تخدم هدف تعلم واحد","two"],["تعريف التمايز","مواءمة المناهج وخبرات التعلم بمستويات المتعلمين","two"],["دور المعلم","يوائم عمق المحتوى والعمليات المعرفية والمنتج والتقييم","two"],["الغرض من التمايز","تيسير إحراز جميع الطلبة تقدمًا مستمرًا","two"],["الهدف طويل المدى","تكوين متعلمين يواصلون طلب العلم طوال الحياة","two"],["معادلة تجربة التعلم","المحتوى + العمليات + المنتج = تجربة تعلم متمايزة","two"],["الأسئلة الثلاثة","ماذا ينبغي أن يتعلم الطالب؟ من يمتلك المعرفة مسبقًا؟ كيف أحقق تقدمه؟","two"],["ملاحظات مهمة","نموذج المقاس الواحد لا يستجيب لجميع الاحتياجات؛ التقويم ملازم للتمايز","two"],["الخطوة الأولى للتخطيط","تخطيط تجارب التعلم بناء على معرفة المتعلم","three"],["التخطيط لتجارب التعلم","بعد التقييم القبلي تُستخدم أدلة التعلم لإعادة تصميم الوحدة","three"],["بلوم المعدل","إطار لتنويع عمق العمليات المعرفية","three"],["ما تصنيف بلوم؟","أتذكر • أفهم • أطبق • أحلل • أقيّم • أبدع","three"],["أبعاد العملية المعرفية","انتقل من استرجاع المعلومات إلى تبريرها وإنتاج حلول جديدة","three"],["الطريقة الأولى داخل الصف","أنشطة متدرجة ومسارات مرنة داخل الدرس الواحد","three"],["الطريقة الثانية: مراكز التعلم","تنظيم محطات مختلفة بما يناسب الهدف وأدلة الجاهزية","three"],["مثال تخطيط: الكسور","تدرج العملية والمحتوى والمنتج في الرياضيات","three"],["مثال: نظرية فيثاغورس","خطة وحدة رياضية تشمل العمليات الست ومستويات تفكير متعددة","three"],["مثال: الفنون البصرية","تخطيط يربط المحتوى الفني بعمليات التفكير والمنتج","three"],["مهمة تربوية (2)","ابدأ إعداد وحدة متمايزة باستخدام الجدول المرجعي","three"],["نموذج التخطيط","حدد المادة والموضوع والحصص؛ ثم أكمل العملية والمحتوى والمنتج","three"],["مساعد (1): أفعال بلوم","استخدم أفعالًا قابلة للملاحظة والتقويم في أهدافك","three"],["مساعد (2): المنتجات","اختر المنتج الذي يثبت التعلم لا الذي يبدو أكثر جاذبية","three"],["استفسارات التخطيط","اسأل قبل التخطيط وبعده عن المحتوى والعملية والمنتج","three"],["تقييم منتجات التعلم","التقييم البنائي يدعم تعديل المنتج أثناء إنجازه","two"],["تعريف المنتج","وسيلة لتوصيل المعلومات أو إظهار المهارات لجمهور محدد","two"],["فئات المنتجات","الكتابي • الشفهي • الفني/المرئي • التقني • الحركي","two"],["أمثلة بحسب الأسلوب","تقرير • عرض شفهي • ملصق • تطبيق • نموذج أو تجربة","two"],["التقويم البنائي","ملاحظات محددة تساعد المتعلم على التحسين قبل التسليم","two"],["مكونات تقييم المنتج","المحتوى • العرض • الإبداع • التأمل والأثر بحسب أداة المنتج","two"],["دراسة بحثية: التصنيف الثاني","قائمة معايير تفصيلية للمحتوى والعرض والإبداع","two"],["دراسة بحثية: التصنيف الثالث","معايير أعمق تتناسب مع درجة تعقيد المنتج","two"],["الاختراع: التصنيف الأول","جودة الفكرة ودقة المحتوى وقابلية العرض","two"],["الاختراع: التصنيف الثالث","عمق التطوير والتوثيق والتأمل في الأثر","two"],["مشروع التعلم الخدمي (1)","معايير المنتج المرتبط بخدمة المجتمع","two"],["مشروع التعلم الخدمي (3)","تطوير أثر المشروع وتوثيق الأدلة والتعلم","two"],["بيئة التعلم","المناخ الصفي شرط داعم لممارسة التمايز","outro"],["تهيئة البيئة التعلمية","الاتجاهات الإيجابية والدعم واحترام التنوع","outro"],["مهمة تربوية (4)","صمم تعديلًا في مناخ صفك يدعم التمايز","outro"],["الختام والمراجعة","تحقق من المخرجات وحدد خطوة تطبيقية في صفك","outro"]];
const labels:Record<string,string>={intro:"الافتتاح",one:"المرحلة الأولى · أسلوبي",two:"المرحلة الثانية · المنتج والتقويم",three:"المرحلة الثالثة · التخطيط",outro:"الإغلاق"};
const colors:Record<string,string>={intro:"#127F88",one:"#2875C7",two:"#E28A26",three:"#2B9B66",outro:"#A650C7"};
export default function InteractiveWorkshop({params}:{params:Promise<{code:string}>}){
 const [code,setCode]=useState("");const [session,setSession]=useState<any>(null);const [stats,setStats]=useState<any>(null);
 const [slide,setSlide]=useState(0);const [qr,setQr]=useState("");const [error,setError]=useState("");const [updated,setUpdated]=useState("");
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
 function fullscreen(){document.documentElement.requestFullscreen?.().catch(()=>{})}
 useEffect(()=>{const handle=(e:KeyboardEvent)=>{if(e.key==="ArrowLeft")setSlide(s=>Math.min(s+1,content.length-1));if(e.key==="ArrowRight")setSlide(s=>Math.max(s-1,0));if(e.key.toLowerCase()==="f")fullscreen()};window.addEventListener("keydown",handle);return()=>window.removeEventListener("keydown",handle)},[]);
 const categoryCounts=useMemo(()=>Object.entries(stats?.distribution??{}),[stats]);
 const link=typeof window!=="undefined"?location.origin+"/w/"+code:"";
 const trainerLink=session?.id?`/trainer/session/${session.id}`:"/trainer";
 
 return <main className="interactiveWorkshop" dir="rtl" style={{minHeight:"100vh",background:"#edf4f6",padding:"16px",color:"#193b4b"}}>
  <header style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",padding:"8px 14px"}}>
   <div><b>قاعة التدريب التفاعلية</b><small style={{display:"block"}}>{session?.title??"جارٍ تحميل الورشة"} • {code}</small></div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
   <a href={trainerLink} target="_blank" rel="noreferrer" className="outlineButton">لوحة المدرب <ExternalLink size={15}/></a>
   <button className="outlineButton" onClick={fullscreen}><Maximize size={16}/> ملء الشاشة</button>
   </div>
  </header>
  {error&&<div role="alert" style={{padding:10,color:"#ab3030"}}>{error} — لن تُعرض نتائج قديمة باعتبارها حية.</div>}
  <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 230px",gap:14,maxWidth:1320,margin:"auto"}} className="workshopPresentationLayout">
   <section style={{background:"white",borderRadius:20,minHeight:530,overflow:"hidden",boxShadow:"0 8px 28px #1234"}}>
    <div style={{height:12,background:colors[item[2]]}}/>
    <div style={{padding:"28px 35px 15px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:colors[item[2]],fontWeight:800}}>{labels[item[2]]}</span><span>محطة تدريبية {slide+1} / {content.length}</span>
    </div>
    <div style={{padding:"12px 40px 35px",minHeight:335}}>
      <div style={{fontSize:15,color:"#597381"}}>تسلسل مستند إلى العرض المرجعي • {item[0]}</div>
      <h1 style={{fontSize:"clamp(27px,3.4vw,41px)",lineHeight:1.45,margin:"18px 0 28px"}}>{item[0]}</h1>
      <div style={{fontSize:"clamp(18px,2.1vw,25px)",lineHeight:2,background:"#f4f9fa",borderRight:"5px solid "+colors[item[2]],borderRadius:14,padding:"22px 26px",whiteSpace:"pre-line"}}>{item[1]}</div>
      {slide===6&&<div style={{display:"flex",gap:12,marginTop:18,alignItems:"center",flexWrap:"wrap"}}><a className="outlineButton" href={link} target="_blank" rel="noreferrer">ابدأ مقياس أسلوبي <ExternalLink size={14}/></a><span>يلزم تصريح المدرب بالمرحلة الأولى لإكمال المقياس.</span></div>}
      {slide===9&&<div style={{marginTop:18}}><a className="outlineButton" href={link} target="_blank" rel="noreferrer">اختيار منتج داخل المنصة <ExternalLink size={14}/></a></div>}
      {slide===26&&<div style={{marginTop:18}}><a className="outlineButton" href="/teacher/lab/bloom" target="_blank" rel="noreferrer">معمل بلوم للتخطيط <ExternalLink size={14}/></a><p style={{fontSize:14}}>هذه أداة تخطيط مساندة وليست تأكيدًا لاكتمال النماذج التنفيذية الثلاثة.</p></div>}
      {locked&&<div style={{background:"#fff6df",padding:16,borderRadius:12,marginTop:16,color:"#835419"}}><LockKeyhole size={16}/> المرحلة لم يفتحها المدرب بعد. يمكنك عرض المفهوم لكن التطبيق مغلق.</div>}
      {(slide===6||slide===8||slide===9)&&<div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginTop:20}}>
        {qr&&<img src={qr} alt="رمز QR لدخول جلسة المتدربين" width={125} height={125}/>}
        <div><b>رمز دخول المتدربين</b><br/><code>{link}</code><br/><a href={link} target="_blank" rel="noreferrer">فتح الجلسة <ExternalLink size={14}/></a></div>
       </div>}
      {slide===8&&stats&&<div><h3>توزيع بصمات المجموعة</h3>{categoryCounts.map(([k,v])=><div key={k} style={{display:"flex",gap:15,margin:7}}><b>{k}</b><progress value={Number(v)} max={Math.max(1,...categoryCounts.map(x=>Number(x[1])))} /><b>{String(v)}</b></div>)}</div>}
      {slide===8&&!stats&&<p style={{color:"#795c22"}}>لعرض إحصاءات الجلسة الحية، افتح لوحة المدرب في تبويب منفصل. لا يتم توليد أرقام تجريبية.</p>}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 24px",borderTop:"1px solid #e3eef0"}}>
     <button className="outlineButton" disabled={slide===0} onClick={()=>go(slide-1)}><ChevronRight size={16}/> السابق</button>
     <span>{slide+1} / {content.length}</span>
     <button className="outlineButton" disabled={slide===content.length-1} onClick={()=>go(slide+1)}>التالي <ChevronLeft size={16}/></button>
    </div>
   </section>
   <aside style={{background:"white",borderRadius:16,padding:18,alignSelf:"start"}}>
     <b>إدارة سير الورشة</b><p style={{fontSize:13,color:"#5f7c8b"}}>المرحلة المسموح بها: {phase===0?"انتظار":phase}. هذا العرض لا يفتح المراحل؛ التحكم من لوحة المدرب فقط.</p>
     {["الافتتاح","أسلوبي","المنتج والتقويم","التخطيط","الختام"].map((v,i)=><button key={v} onClick={()=>go(i===0?0:i===1?content.findIndex(x=>x[2]==="one"):i===2?content.findIndex(x=>x[2]==="two"):i===3?content.findIndex(x=>x[2]==="three"):content.findIndex(x=>x[2]==="outro"))} style={{display:"block",width:"100%",margin:"8px 0",padding:12,textAlign:"right",borderRadius:10,border:"1px solid #d8e6e9",background:i===(phase||0)?"#e8f5f3":"white",cursor:"pointer"}}>{v}</button>)}
     <hr/><p style={{fontSize:13}}>لتفعيل مرحلة جديدة: افتح لوحة المدرب واضغط «إذن البدء». لا يُسمح للمتدربين بتجاوزها.</p>
     <div style={{display:"flex",gap:5,alignItems:"center",fontSize:12,color:"#66818b"}}><RefreshCw size={14}/> {updated||"آخر تحديث غير متاح"}</div>
   </aside>
  </div>
 </main>
}