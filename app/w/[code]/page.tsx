"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2, Download,
  FlaskConical, GraduationCap, Layers3, Share2, Sparkles, Target, UsersRound
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { products, scoreLabels, styleItems, styleMeta, type StyleCode } from "@/lib/workshop/styleData";

type Stage="join"|"scale"|"report"|"products"|"evaluate"|"journey"|"diagnosis"|"differentiate"|"lesson"|"apply"|"finalReport"|"done";
type Scores=Record<StyleCode,number>;
type Rubric={id:string;level_no:number;section:string;subsection:string|null;criterion_template:string;essential:boolean;min_score:number;max_score:number;sort_order:number};

const emptyScores:Scores={W:0,O:0,V:0,T:0,K1a:0,K2c:0,K3s:0,K4p:0,K5h:0,K6m:0};

function codeText(code:StyleCode,primary:boolean){
  return primary?code:code.toLowerCase();
}
function calculate(answers:Record<number,number>){
  const sums:Scores={...emptyScores};
  const counts:Scores={...emptyScores};
  styleItems.forEach(i=>{const v=answers[i.id]??0;sums[i.code]+=v;counts[i.code]+=v?1:0});
  const rows=(Object.keys(sums) as StyleCode[]).map(code=>({code,score:sums[code],mean:counts[code]?sums[code]/counts[code]:0})).sort((a,b)=>b.mean-a.mean);
  const top=rows.slice(0,3);
  return {rows,top,fingerprint:top.map((x,i)=>codeText(x.code,i===0)).join("-")};
}

function Radar({rows}:{rows:{code:StyleCode;mean:number}[]}){
  const center=160,maxR=116,n=rows.length;
  const point=(i:number,value:number)=>{
    const a=(-Math.PI/2)+(i/n)*Math.PI*2,r=(value/5)*maxR;
    return [center+Math.cos(a)*r,center+Math.sin(a)*r];
  };
  const grids=[1,2,3,4,5].map(level=>rows.map((_,i)=>point(i,level).join(",")).join(" "));
  const data=rows.map((r,i)=>point(i,r.mean).join(",")).join(" ");
  return <svg className="fingerprintRadar" viewBox="0 0 320 320">
    {grids.map((g,i)=><polygon key={i} points={g} fill="none" stroke="#dfeaec" strokeWidth="1"/>)}
    {rows.map((_,i)=>{const p=point(i,5);return <line key={i} x1="160" y1="160" x2={p[0]} y2={p[1]} stroke="#e5edef"/>})}
    <polygon points={data} fill="rgba(47,143,135,.16)" stroke="#2f8f87" strokeWidth="3"/>
    {rows.map((r,i)=>{const p=point(i,r.mean),l=point(i,5.65);return <g key={r.code}><circle cx={p[0]} cy={p[1]} r="4" fill="#fff" stroke="#2f8f87" strokeWidth="2"/><text x={l[0]} y={l[1]} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#526d78">{r.code}</text></g>})}
  </svg>
}

function ParticipantJourney({active}:{active:number}){
  const steps=["أسلوبي","بصمتي","المنتج","التطوير","تقريري"];
  return <nav className="participantJourney" aria-label="رحلة المشارك">{steps.map((s,i)=><div key={s} className={i+1===active?"active":i+1<active?"done":""}><i>{i+1}</i><span>{s}</span></div>)}</nav>
}

const diagnosisGroups=[
  {key:"support",title:"مسار الدعم",count:7,readiness:48,range:"فهم → تطبيق → تحليل بسيط",goal:"يفسر خصائص الفيروس ويطبق الفكرة على مثال موجه.",process:"بطاقات مفاهيم + مثال محلول + دعم بصري.",product:"خريطة مفاهيم مشروحة."},
  {key:"core",title:"المسار الأساسي",count:15,readiness:74,range:"تطبيق → تحليل → تقويم",goal:"يحلل تركيب الفيروس ويقارن آلية تكاثره بالخلايا.",process:"تحليل مخطط + مقارنة منظمة + نقاش ثنائي.",product:"إنفوجرافيك تفسيري."},
  {key:"stretch",title:"مسار التحدي",count:6,readiness:91,range:"تحليل → تقويم → إبداع",goal:"يقيم أثر خصائص الفيروس ويصمم تمثيلًا يفسر دورة التكاثر.",process:"حالة علمية + نقد تفسير + تصميم نموذج.",product:"فيديو/محاكاة قصيرة مع تبرير علمي."}
];

export default function WorkshopParticipant(){
  const params=useParams<{code:string}>();
  const code=(params.code??"").toUpperCase();
  const supabase=useMemo(()=>getSupabaseBrowserClient(),[]);
  const [stage,setStage]=useState<Stage>("join");
  const [session,setSession]=useState<any>(null);
  const [token,setToken]=useState("");
  const [name,setName]=useState("");
  const [org,setOrg]=useState("");
  const [email,setEmail]=useState("");
  const [mobile,setMobile]=useState("");
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [current,setCurrent]=useState(0);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [selectedProduct,setSelectedProduct]=useState<any>(null);
  const [participantProduct,setParticipantProduct]=useState<any>(null);
  const [level,setLevel]=useState(1);
  const [rubric,setRubric]=useState<Rubric[]>([]);
  const [rubricScores,setRubricScores]=useState<Record<string,number>>({});
  const [criterionNotes,setCriterionNotes]=useState<Record<string,string>>({});
  const [rubricFeedback,setRubricFeedback]=useState("");
  const [evaluatorType,setEvaluatorType]=useState<"self"|"trainer"|"peer">("self");
  const [evaluatorName,setEvaluatorName]=useState("");
  const [developmentPriority,setDevelopmentPriority]=useState("");
  const [nextRecommendation,setNextRecommendation]=useState("");
  const [rubricLoading,setRubricLoading]=useState(false);
  const [lastEval,setLastEval]=useState<any>(null);
  const [levelTransition,setLevelTransition]=useState<number|null>(null);
  const [journey,setJourney]=useState<any>(null);
  const [lessonNote,setLessonNote]=useState("");
  const [lessonSubject,setLessonSubject]=useState("أحياء 1");
  const [lessonTitle,setLessonTitle]=useState("الفيروسات");
  const [lessonClassSize,setLessonClassSize]=useState(28);
  const [applicationSent,setApplicationSent]=useState(false);
  const [qualificationStatus,setQualificationStatus]=useState<string>("in_progress");
  const [resumeCode,setResumeCode]=useState("");
  const [resumeMode,setResumeMode]=useState(false);

  const result=useMemo(()=>calculate(answers),[answers]);
  const answered=Object.keys(answers).length;
  const progress=Math.round((answered/50)*100);
  const item=styleItems[current];

  async function shareReport(){const text="تقريري في "+(session?.title||"ورشة التمايز")+" • بصمتي: "+result.fingerprint+(selectedProduct?.product_name?" • المنتج: "+selectedProduct.product_name:"");if(typeof navigator!=="undefined"&&navigator.share){try{await navigator.share({title:"تقرير تجربة التمايز",text,url:window.location.href})}catch{}}else if(typeof navigator!=="undefined"){await navigator.clipboard.writeText(text+" "+window.location.href);setNotice("تم نسخ ملخص التقرير والرابط.")}}
  function printNamed(kind:string){
    if(typeof document==="undefined") return;
    const old=document.title;
    const date=new Date().toISOString().slice(0,10);
    document.title=((name||"مشارك")+" - "+kind+" - "+date).replace(/[\\/:*?"<>|]/g,"-");
    window.print();
    window.setTimeout(()=>{document.title=old},1200);
  }

  async function api(action:string,payload:any={}){
    const {data,error}=await supabase.functions.invoke("workshop-public",{body:{action,...payload}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }

  useEffect(()=>{
    api("session",{code}).then(d=>setSession(d.session)).catch(()=>setNotice("الجلسة غير موجودة أو مغلقة حاليًا."));
  },[code]);

  useEffect(()=>{const saved=typeof window!=="undefined"?localStorage.getItem("tamayoz-workshop-"+code):null;if(!saved)return;(async()=>{try{const d=await api("resume",{participant_token:saved});setToken(saved);const savedAnswers=localStorage.getItem("tamayoz-answers-"+code);if(savedAnswers){try{setAnswers(JSON.parse(savedAnswers))}catch{}}else if(d.answers&&Object.keys(d.answers).length){setAnswers(d.answers);localStorage.setItem("tamayoz-answers-"+code,JSON.stringify(d.answers))}setName(d.participant?.full_name||"");setOrg(d.participant?.organization_name||"");setResumeCode(d.participant?.resume_code||"");setQualificationStatus(d.participant?.qualification_status||"in_progress");if(d.product){setSelectedProduct(d.product);setParticipantProduct(d.participant_product);setLevel(d.participant_product?.current_level||1);setStage("products")}else if(d.fingerprint){setStage("products")}else if(d.answers&&Object.keys(d.answers).length){setCurrent(Math.min(49,Object.keys(d.answers).length));setStage("scale")}else{setStage("scale")}}catch{localStorage.removeItem("tamayoz-workshop-"+code)}})()},[code]);

  async function join(e:FormEvent){
    e.preventDefault();setBusy(true);setNotice("");
    try{
      const d=await api("join",{code,full_name:name,organization_name:org,email:email||null,mobile:mobile||null});
      const t=d.participant.participant_token;
      setToken(t);
      setResumeCode(d.participant.resume_code||"");
      localStorage.setItem("tamayoz-workshop-"+code,t);
      if(d.participant.resume_code) localStorage.setItem("tamayoz-resume-"+code,d.participant.resume_code);
      setStage("scale");
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر الدخول.")}finally{setBusy(false)}
  }

  async function resumeWithCode(e:FormEvent){
    e.preventDefault();setBusy(true);setNotice("");
    try{
      const d=await api("resume_by_code",{code,resume_code:resumeCode});
      const t=d.participant.participant_token;
      setToken(t);
      setName(d.participant.full_name||"");
      setOrg(d.participant.organization_name||"");
      setQualificationStatus(d.participant.qualification_status||"in_progress");
      localStorage.setItem("tamayoz-workshop-"+code,t);
      localStorage.setItem("tamayoz-resume-"+code,d.participant.resume_code||resumeCode.toUpperCase());
      const resumed=await api("resume",{participant_token:t});
      if(resumed.answers&&Object.keys(resumed.answers).length){
        setAnswers(resumed.answers);
        localStorage.setItem("tamayoz-answers-"+code,JSON.stringify(resumed.answers));
      }
      if(resumed.product){
        setSelectedProduct(resumed.product);setParticipantProduct(resumed.participant_product);setLevel(resumed.participant_product?.current_level||1);setStage("products");
      }else if(resumed.fingerprint){setStage("products")}
      else if(resumed.answers&&Object.keys(resumed.answers).length){setCurrent(Math.min(49,Object.keys(resumed.answers).length));setStage("scale")}
      else{setStage("scale")}
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر استكمال الرحلة بهذا الرمز.")}finally{setBusy(false)}
  }

  function choose(v:number){
    setAnswers(a=>({...a,[item.id]:v}));
    setNotice("");
    if(current<49) window.setTimeout(()=>setCurrent(x=>Math.min(49,x+1)),280);
  }

  async function finishScale(){
    if(answered<50){setNotice("أكمل جميع العبارات أولًا.");return}
    setBusy(true);setNotice("");
    try{
      await api("save_responses",{participant_token:token,answers:Object.entries(answers).map(([id,score])=>({item_id:Number(id),score}))});
      await api("save_fingerprint",{
        participant_token:token,
        fingerprint_code:result.fingerprint,
        primary_code:result.top[0].code,
        secondary_codes:result.top.slice(1).map(x=>x.code),
        dimension_scores:Object.fromEntries(result.rows.map(x=>[x.code,{score:x.score,mean:Number(x.mean.toFixed(2))}]))
      });
      localStorage.setItem("tamayoz-answers-"+code,JSON.stringify(answers));
      setStage("report");
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر حفظ النتيجة.")}finally{setBusy(false)}
  }

  const productRoles:Record<StyleCode,string>={W:"كاتب/موثق",O:"متحدث/محاور",V:"مصمم بصري",T:"منفذ تقني",K1a:"مصمم فني",K2c:"منظم/مسوق",K3s:"منسق أثر",K4p:"مؤدٍ/ممثل",K5h:"صانع/منفذ",K6m:"صوت/إيقاع"};
  type ProductFilter="ALL"|"W"|"O"|"V"|"T"|"K";
  const productGroups=useMemo<{code:Exclude<ProductFilter,"ALL">;label:string}[]>(()=>[
    {code:"W",label:"كتابي"},{code:"O",label:"شفهي"},{code:"V",label:"مرئي/صوتي"},{code:"T",label:"تقني"},{code:"K",label:"حركي"}
  ],[]);
  const [productFilter,setProductFilter]=useState<ProductFilter>("ALL");
  const [productQuery,setProductQuery]=useState("");
  const [productLimit,setProductLimit]=useState(12);
  const topCodes=result.top.map(t=>t.code);
  const filteredProducts=useMemo(()=>products
    .filter(p=>productFilter==="ALL" ? true : productFilter==="K" ? String(p[0]).startsWith("K-") : p[2]===productFilter)
    .filter(p=>!productQuery.trim() || String(p[1]).includes(productQuery.trim()) || String(p[0]).toLowerCase().includes(productQuery.trim().toLowerCase()))
    .sort((a:any,b:any)=>Number(topCodes.includes(b[2] as StyleCode))-Number(topCodes.includes(a[2] as StyleCode)))
  ,[productFilter,productQuery,result.fingerprint]);
  const visibleProducts=filteredProducts.slice(0,productLimit);
  function fitLabel(p:any){return topCodes.includes(p[2] as StyleCode)?"يلائم بصمتك مباشرة":"يمكنك توظيف بصمتك داخله"}
  function roleFor(p:any){return productRoles[result.top[0].code]}
  const generatedGroups=useMemo(()=>{
    const support=Math.max(1,Math.round(lessonClassSize*.25));
    const core=Math.max(1,Math.round(lessonClassSize*.54));
    const stretch=Math.max(1,lessonClassSize-support-core);
    const counts=[support,core,stretch];
    return diagnosisGroups.map((g,i)=>({
      ...g,
      count:counts[i],
      goal:lessonTitle==="الفيروسات"?g.goal:
        i===0?"يفهم المفاهيم الأساسية في «"+lessonTitle+"» ويطبقها بدعم موجّه.":
        i===1?"يطبق ويحلل مفاهيم «"+lessonTitle+"» في مهمة منظمة ويبرر اختياراته.":
        "يحلل ويقوّم «"+lessonTitle+"» ثم ينتج تفسيرًا أو حلًا أكثر عمقًا وإبداعًا."
    }));
  },[lessonClassSize,lessonTitle]);

  async function selectProduct(p:any){
    setBusy(true);setNotice("");
    try{
      const d=await api("select_product",{participant_token:token,product_id:p[0]});
      setSelectedProduct(d.product);
      setParticipantProduct(d.participant_product);
      setLevel(d.participant_product.current_level);
      setStage("evaluate");
      await loadRubric(d.participant_product.current_level,d.product.product_name,d.product.product_id);
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر اختيار المنتج.")}finally{setBusy(false)}
  }

  async function loadRubric(lvl:number,productName?:string,productId?:string){
    setRubricLoading(true);
    try{
      const d=await api("rubric",{participant_token:token,level_no:lvl,product_id:productId??selectedProduct?.product_id});
      const rows=(d.rubric??[]).map((r:Rubric)=>({...r,criterion_template:r.criterion_template.replaceAll("{product}",productName??selectedProduct?.product_name??"المنتج")}));
      setRubric(rows);
      setRubricScores({});
      setCriterionNotes({});
      setRubricFeedback("");
      setDevelopmentPriority("");
      setNextRecommendation("");
    }finally{setRubricLoading(false)}
  }

  const visibleRubric=useMemo(()=>evaluatorType==="self"?rubric:rubric.filter(r=>r.section!=="التأمل"),[rubric,evaluatorType]);

  async function submitLevel(){
    if(visibleRubric.some(r=>rubricScores[r.id]===undefined)){setNotice("قيّم جميع المعايير الظاهرة قبل الإرسال.");return}
    setBusy(true);setNotice("");
    try{
      const d=await api("submit_evaluation",{
        participant_token:token,
        participant_product_id:participantProduct.id,
        level_no:level,
        evaluator_type:evaluatorType,
        evaluator_name:evaluatorName||name||null,
        scores:visibleRubric.map(r=>({rubric_template_id:r.id,score:rubricScores[r.id]})),
        notes:visibleRubric.map(r=>({rubric_template_id:r.id,note:criterionNotes[r.id]||null})),
        feedback:rubricFeedback||null,
        development_priority:developmentPriority||null,
        next_recommendation:nextRecommendation||null
      });
      setLastEval(d);
      if(d.passed){
        if(d.status==="completed"){
          setParticipantProduct({...participantProduct,current_level:3,status:"completed"});
        }else{
          setParticipantProduct({...participantProduct,current_level:d.next_level,status:"in_progress"});
        }
      }
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر حفظ التقييم.")}finally{setBusy(false)}
  }

  function openNextLevel(){
    if(!lastEval?.passed || !lastEval?.next_level) return;
    setLevelTransition(lastEval.next_level);
  }

  async function enterNextLevel(){
    if(!levelTransition) return;
    const next=levelTransition;
    setLevel(next);
    setLastEval(null);
    setNotice("");
    setLevelTransition(null);
    await loadRubric(next,selectedProduct?.product_name,selectedProduct?.product_id);
  }

  const levelShift=levelTransition===2?{
    eyebrow:"من التأسيس إلى الإتقان",
    title:"لقد تغيّر سقف التحدي.",
    lead:"في المستوى الأول كنت تتحقق من سلامة الأساس. الآن لن يكفي أن يكون المنتج صحيحًا؛ المطلوب أن يصبح أكثر تنظيمًا وعمقًا واتساقًا.",
    threshold:"4.5",
    moves:[
      ["المحتوى","من صحيح ومفهوم","إلى دقيق، أعمق، ومنظم"],
      ["العرض","من استيفاء المتطلبات","إلى تنفيذ متقن يخدم الغرض مباشرة"],
      ["الإبداع","من فكرة جديدة","إلى ظهور رؤيتك الشخصية وحماسك"],
      ["التأمل","من وصف ما حدث","إلى تحليل التعلم والتحسينات القادمة"]
    ]
  }:levelTransition===3?{
    eyebrow:"من الإتقان إلى الاحتراف",
    title:"الآن لا نبحث عن منتج جيد فقط.",
    lead:"المستوى الثالث يرفع التوقعات إلى معالجة احترافية: تفاصيل أشمل، فهم أعمق، اتساق أعلى، وصوت شخصي وتأمل قادر على استشراف التطوير القادم.",
    threshold:"5.0",
    moves:[
      ["المحتوى","من الدقة والتنظيم","إلى الشمول وسبر أغوار الموضوع"],
      ["العرض","من تنفيذ متقن","إلى معالجة احترافية تعزز فهم المتلقي"],
      ["الإبداع","من رؤية شخصية","إلى رؤية متميزة وشغف فريد في الإنتاج"],
      ["التأمل","من تحليل التجربة","إلى تقويمها وبناء روابط مستقبلية مستنيرة"]
    ]
  }:null;

  const rubricAnalysis=useMemo(()=>{
    if(!visibleRubric.length) return {sections:[] as {name:string;average:number}[],strongest:null as Rubric|null,weakest:[] as Rubric[],answered:0,average:0};
    const scored=visibleRubric.filter(r=>rubricScores[r.id]!==undefined);
    const sectionNames=[...new Set(visibleRubric.map(r=>r.section))];
    const sections=sectionNames.map(section=>{
      const rows=visibleRubric.filter(r=>r.section===section&&rubricScores[r.id]!==undefined);
      const average=rows.length?rows.reduce((sum,r)=>sum+(rubricScores[r.id]??0),0)/rows.length:0;
      return {name:section,average:Number(average.toFixed(1))};
    });
    const ranked=[...scored].sort((a,b)=>(rubricScores[b.id]??0)-(rubricScores[a.id]??0));
    const weakest=[...scored].sort((a,b)=>(rubricScores[a.id]??0)-(rubricScores[b.id]??0)).slice(0,3);
    const average=scored.length?scored.reduce((sum,r)=>sum+(rubricScores[r.id]??0),0)/scored.length:0;
    return {sections,strongest:ranked[0]??null,weakest,answered:scored.length,average:Number(average.toFixed(1))};
  },[visibleRubric,rubricScores]);

  function developmentAdvice(r:Rubric){
    const score=rubricScores[r.id]??0;
    if(score>=5) return "حافظ على هذا المستوى، وجرّب نقله إلى بقية عناصر المنتج.";
    if(r.section==="المحتوى") return "راجع دقة المحتوى وعمقه وتنظيمه، وأضف ما يدعم الفكرة ويجعلها أوضح للمتلقي.";
    if(r.section==="العرض") return "طوّر هذا العنصر في النسخة القادمة، وراجع وضوحه واتساقه ومدى خدمته لغرض المنتج.";
    if(r.section==="الإبداع") return "ابحث عن معالجة أكثر أصالة تُظهر رؤيتك الشخصية بدل الاكتفاء بالصيغة المعتادة.";
    return "اكتب تأملًا أعمق يربط التعلم السابق بما حدث في المنتج وما ستغيره في المحاولة القادمة.";
  }

  async function openJourney(){
    if(!participantProduct?.id) return;
    setBusy(true);setNotice("");
    try{
      const d=await api("product_journey",{participant_token:token,participant_product_id:participantProduct.id});
      setJourney(d);setStage("journey");
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر تحميل سجل رحلة المنتج.")}finally{setBusy(false)}
  }

  function printRubric(){ printNamed("بطاقة تطوير المنتج"); }

  async function apply(e:FormEvent){
    e.preventDefault();setBusy(true);setNotice("");
    try{
      await api("apply",{participant_token:token,email,mobile,school_name:org,note:lessonNote,interested:true});
      setApplicationSent(true);if(participantProduct?.id){try{const j=await api("product_journey",{participant_token:token,participant_product_id:participantProduct.id});setJourney(j)}catch{}}setStage("finalReport");
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر إرسال الطلب.")}finally{setBusy(false)}
  }

  if(!session) return <main className="participantGate"><div className="participantGateCard"><div className="differenceMark"><span>ت</span></div><h1>التمايز</h1><p>{notice||"جارٍ التحقق من جلسة الورشة..."}</p></div></main>;

  if(stage==="join") return <main className="participantGate">
    <section className="participantJoinCard">
      <div className="platformBrand"><div className="differenceMark"><span>ت</span></div><div><b>التمايز</b><small>ورشة حية</small></div></div>
      <span className="sessionJoinCode">{session.session_code}</span>
      <h1>{session.title}</h1>
      <p>ستعيش تجربة التمايز بنفسك أولًا، ثم ترى كيف تتحول البيانات إلى قرار تعليمي.</p>
      {session.trainer_names?.length>0&&<div className="trainerLine">المدرب: {session.trainer_names.join("، ")}</div>}
      {!resumeMode?<form onSubmit={join} className="participantJoinForm">
        <label>الاسم<input required value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم"/></label>
        <label>الجهة<input value={org} onChange={e=>setOrg(e.target.value)} placeholder="المدرسة / الجهة"/></label>
        <div className="joinOptional"><label>البريد <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="اختياري"/></label><label>الجوال<input value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="اختياري"/></label></div>
        <button className="primaryButton" disabled={busy}>دخول الجلسة <ArrowLeft size={17}/></button>
      </form>:<form onSubmit={resumeWithCode} className="participantJoinForm resumeForm">
        <label>رمز الاستكمال<input required value={resumeCode} onChange={e=>setResumeCode(e.target.value.toUpperCase())} placeholder="مثال: A1B2C3D4E5" maxLength={10}/></label>
        <button className="primaryButton" disabled={busy}>استكمال رحلتي <ArrowLeft size={17}/></button>
      </form>}
      <button type="button" className="resumeSwitch" onClick={()=>{setResumeMode(v=>!v);setNotice("")}}>{resumeMode?"دخول جديد":"لدي رمز استكمال"}</button>
      {notice&&<div className="loginMessage">{notice}</div>}
    </section>
  </main>;

  if(stage==="scale") return <main className="workshopPage scalePage">
    <header className="scaleHeader"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>أسلوبي</b><small>مقياس أسلوب التعبير</small></div></div>{resumeCode&&<div className="resumeCodeBadge"><span>رمز الاستكمال</span><b>{resumeCode}</b></div>}<div className="scaleProgressMeta"><b>{progress}%</b><span>{answered} من 50</span></div></header>
    <ParticipantJourney active={1}/><div className="scaleProgress"><i style={{width:progress+"%"}}/></div>
    <section className="questionShell">
      <div className="questionMetaRow"><div className="questionNumber">العبارة {item.id} من 50</div><span className="questionAnswered">{answers[item.id] ? "تمت الإجابة ✓" : "اختر إجابتك"}</span></div>
      <h1>{item.text}</h1><p>اختر الدرجة الأقرب لما تشعر به الآن، دون تفكير طويل.</p>
      <div className="answerScale">{scoreLabels.map(opt=><button key={opt.value} className={answers[item.id]===opt.value?"selected":""} onClick={()=>choose(opt.value)}><strong>{opt.value}</strong><span>{opt.label}</span>{answers[item.id]===opt.value&&<Check size={15}/>}</button>)}</div>
      <div className="scaleNav"><button className="outlineButton" disabled={current===0} onClick={()=>setCurrent(x=>Math.max(0,x-1))}><ArrowRight size={16}/> السابق</button><span>تحفظ الإجابات في هذه الجلسة</span>{current===49?<button className="primaryButton" disabled={busy||answered<50} onClick={finishScale}>إظهار بصمتي <Sparkles size={16}/></button>:<button className="outlineButton" onClick={()=>setCurrent(x=>Math.min(49,x+1))}>التالي <ArrowLeft size={16}/></button>}</div>
      {notice&&<div className="loginMessage">{notice}</div>}
    </section>
  </main>;

  if(stage==="report"){
    const primary=result.top[0],second=result.top[1],third=result.top[2];
    return <main className="reportPage">
      <header className="reportTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>تقرير بصمة التعبير</small></div></div><div className="reportIdentity"><b>{session?.title || "ورشة التمايز"}</b><span>{session?.trainer_names?.length ? "المدرب/المدربون: "+session.trainer_names.join("، ") : "ورشة التمايز"}</span><small>{new Date().toLocaleDateString("ar-SA",{year:"numeric",month:"long",day:"numeric"})}</small></div><div className="reportActions noPrint"><button className="outlineButton" onClick={()=>printNamed("تقرير بصمة التعبير")}><Download size={16}/> حفظ PDF</button><button className="outlineButton" onClick={shareReport}><Share2 size={16}/> مشاركة</button></div></header>
      <ParticipantJourney active={2}/><section className="reportHero"><div className="reportHeroMain"><span className="reportEyebrow">بصمتك التعبيرية</span><div className="fingerprintCode">{result.fingerprint}</div><div className="reportPerson"><h1>{name}</h1><p>{org || "مشارك في الورشة"}</p></div><small className="fingerprintTagline">لكل متعلم طريقة فريدة للتعبير</small></div><div className="fingerprintVisual"><div className="fingerprintGlyph">◎</div><span>{primary.code}</span></div><div className="fingerprintSummary"><span>البعد الأكثر حضورًا</span><b>{styleMeta[primary.code].title}</b><strong>{primary.mean.toFixed(1)}<em>/5</em></strong><small>{styleMeta[primary.code].shortTitle}</small></div></section>
      <section className="reportGrid">
        <article className="reportCard radarCard"><div className="reportCardHead"><div><span>الملف الكمي</span><h2>خريطة بصمتك</h2></div><BarChart3 size={21}/></div><Radar rows={result.rows}/></article>
        <article className="reportCard rankingCard"><div className="reportCardHead"><div><span>الترتيب</span><h2>أبعاد التعبير</h2></div></div><div className="rankingList">{result.rows.map((r,i)=><div key={r.code}><span className="rankNo">{i+1}</span><div className="rankText"><b>{styleMeta[r.code].title}</b><span>{r.code}</span></div><div className="rankBar"><i style={{width:(r.mean/5)*100+"%"}}/></div><strong>{r.mean.toFixed(1)}</strong></div>)}</div></article>
        <article className="reportCard narrativeCard"><span className="sectionKicker">اقرأ نفسك من خلال النتيجة</span><h2>ماذا تقول بصمتك؟</h2><p><b>{styleMeta[primary.code].title}</b> هو الأكثر حضورًا؛ {styleMeta[primary.code].description}</p><p>ثم يظهر <b>{styleMeta[second.code].title}</b> وبعده <b>{styleMeta[third.code].title}</b>. هذا لا يحصرك في منتج واحد، بل يوضح كيف يمكن أن تسهم بطريقتك داخل منتجات متنوعة.</p><div className="narrativeTiles"><div className="roleTile"><span>دور قد يناسبك</span><b>{styleMeta[primary.code].role}</b></div><div className="growthTile"><span>مساحة نمو</span><b>{styleMeta[primary.code].growth}</b></div><div className="topThreeTile"><span>أعلى ثلاثة أبعاد</span><b>{primary.code} {primary.mean.toFixed(1)} · {second.code} {second.mean.toFixed(1)} · {third.code} {third.mean.toFixed(1)}</b></div></div><small>هذه النتيجة تصف تفضيلات التعبير الحالية وليست حكمًا ثابتًا على قدراتك.</small></article>
      </section>
      <section className="reportNext"><div><span className="sectionKicker">المحطة التالية</span><h2>من البصمة إلى المنتج</h2><p>اختر منتجًا بحرية، ثم طوّره عبر ثلاثة مستويات وفق المحتوى والعرض والإبداع والتأمل.</p></div><button className="primaryButton" onClick={()=>setStage("products")}>استكشف المنتجات <ArrowLeft size={17}/></button></section>
      <footer className="reportFooter"><span>التمايز • diff.t7iq.com</span><span>المدرب: {session.trainer_names?.join("، ")}</span></footer>
    </main>
  }

  if(stage==="products") return <main className="workshopPage productPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>من البصمة إلى المنتج</small></div></div><button className="outlineButton" onClick={()=>setStage("report")}><ArrowRight size={16}/> تقريري</button></header>
    <ParticipantJourney active={3}/><section className="productHero"><span className="smartBadge"><Sparkles size={15}/> بصمتك {result.fingerprint}</span><h1>اختر المنتج الذي يشعل فضولك.</h1><p>كل المنتجات متاحة لك. بصمتك لا تقيد اختيارك؛ بل تساعدك في تحديد <b>الدور الذي تضيف به قوتك</b> داخل المنتج أو فريق العمل.</p></section>
    <div className="productDiscovery">
      <nav className="productFilters"><button className={productFilter==="ALL"?"active":""} onClick={()=>{setProductFilter("ALL");setProductLimit(12)}}>الكل <small>{products.length}</small></button>{productGroups.map(g=><button key={g.code} className={productFilter===g.code?"active":""} onClick={()=>{setProductFilter(g.code);setProductLimit(12)}}>{g.label}</button>)}</nav>
      <label className="productSearch"><span>ابحث عن منتج</span><input value={productQuery} onChange={e=>{setProductQuery(e.target.value);setProductLimit(12)}} placeholder="مثال: تقرير، فيديو، مجلة…"/></label>
    </div>
    <div className="productChoiceHint"><UsersRound size={18}/><div><b>فكر بالمنتج أولًا، ثم بالدور.</b><span>مثال: صاحب البصمة الكتابية يمكنه اختيار «فيلم» ويكون دوره كتابة السيناريو أو توثيق المحتوى، بينما يكمل زملاؤه الأدوار البصرية والتقنية والأدائية.</span></div></div>
    <div className="productResultMeta"><b>{filteredProducts.length}</b><span>منتجًا مطابقًا • نعرض الأقرب لبصمتك أولًا</span></div>
    <section className="productGrid allProductGrid">{visibleProducts.map((p:any)=><article key={p[0]} className={"productCard "+(topCodes.includes(p[2] as StyleCode)?"directFit":"")}><div className="productCardTop"><span className="productCode">{p[0]}</span>{topCodes.includes(p[2] as StyleCode)&&<span className="recommendedTag">قريب من بصمتك</span>}</div><h2>{p[1]}</h2><p>{fitLabel(p)}</p><div className="productRole"><span>دورك المقترح وفق بصمتك</span><b>{roleFor(p)}</b></div><button className="outlineButton" disabled={busy} onClick={()=>selectProduct(p)}>اختيار هذا المنتج</button></article>)}</section>
    {visibleProducts.length<filteredProducts.length&&<div className="productMore"><button className="outlineButton" onClick={()=>setProductLimit(x=>x+12)}>عرض 12 منتجًا إضافيًا</button><span>ظهر {visibleProducts.length} من {filteredProducts.length}</span></div>}
    {filteredProducts.length===0&&<div className="emptyJourney">لا توجد منتجات مطابقة. غيّر البحث أو التصنيف.</div>}
    {notice&&<div className="loginMessage">{notice}</div>}
  </main>;

  if(stage==="evaluate"&&levelShift) return <main className="workshopPage levelTransitionPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>{selectedProduct?.product_name}</b><small>مسار تطوير المنتج</small></div></div><span className="levelBadge">L{level} → L{levelTransition}</span></header>
    <section className="transitionHero"><div className="transitionLevelMark"><span>المستوى التالي</span><strong>{levelTransition}</strong></div><div><span className="sectionKicker">{levelShift.eyebrow}</span><h1>{levelShift.title}</h1><p>{levelShift.lead}</p></div></section>
    <section className="challengeShift"><div className="challengeShiftHead"><div><span className="sectionKicker">ما الذي تغيّر؟</span><h2>نفس المنتج… ولكن بمعيار أداء أعلى.</h2></div><div className="newThreshold"><span>متوسط العبور الجديد</span><b>{levelShift.threshold}<small>/6</small></b></div></div><div className="shiftGrid">{levelShift.moves.map(([axis,from,to])=><article key={axis}><span>{axis}</span><div><small>{from}</small><ArrowLeft size={15}/><b>{to}</b></div></article>)}</div></section>
    <section className="transitionMessage"><Sparkles size={20}/><div><b>لا تبدأ من الصفر.</b><span>احتفظ بما أتقنته في النسخة السابقة، ووجّه جهدك إلى رفع العمق والجودة في المتطلبات الجديدة. هذه هي فكرة التطوير المتدرج للمنتج.</span></div></section>
    <div className="transitionActions"><button className="outlineButton" onClick={()=>setLevelTransition(null)}><ArrowRight size={16}/> العودة لنتيجة المستوى {level}</button><button className="primaryButton" onClick={enterNextLevel}>ابدأ المستوى {levelTransition} <ArrowLeft size={17}/></button></div>
  </main>;

  if(stage==="evaluate") return <main className="workshopPage evaluationPage">
    <header className="workshopTop evaluationTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>{selectedProduct?.product_name}</b><small>بطاقة تطوير المنتج • المستوى {level}</small></div></div><div className="evaluationHeaderActions"><span className="levelBadge">L{level}</span><button className="outlineButton" onClick={printRubric}><Download size={16}/> PDF / طباعة</button></div></header>
    <ParticipantJourney active={4}/><section className="evaluationHero"><div><span className="sectionKicker">مسار تطوير المنتج</span><h1>{level===1?"المستوى الأول — ابنِ الأساس":level===2?"المستوى الثاني — ارفع مستوى الإتقان":"المستوى الثالث — اصنع النسخة الاحترافية"}</h1><p>طبّق البطاقة إلكترونيًا على منتجك الحالي. يمكنك كذلك تصدير البطاقة PDF وطباعتها قبل أو بعد التعبئة.</p><div className="passRule"><b>شرط العبور:</b> متوسط لا يقل عن {level===1?"4.0":level===2?"4.5":"5.0"} من 6، مع اجتياز جميع المعايير الجوهرية.</div></div><div className="levelJourney"><span className={level>=1?"done":""}>1</span><i/><span className={level>=2?"done":""}>2</span><i/><span className={level>=3?"done":""}>3</span></div></section>
    <section className="rubricPrintMeta"><div><span>المنتج</span><b>{selectedProduct?.product_name}</b></div><div><span>المشارك</span><b>{name}</b></div><div><span>المستوى</span><b>{level} من 3</b></div><div><span>التاريخ</span><b>{new Date().toLocaleDateString("ar-SA")}</b></div></section>
    <section className="evaluatorPanel noPrint">
      <div><span className="sectionKicker">نوع التقييم</span><h2>تقييم مختلط: كمي + نوعي</h2><p>اختر المقيم. الخبير والأقران يقيمون المحتوى والعرض والإبداع، بينما يشمل التقييم الذاتي التأمل أيضًا.</p></div>
      <div className="evaluatorControls"><label>المقيم<select value={evaluatorType} onChange={e=>setEvaluatorType(e.target.value as "self"|"trainer"|"peer")}><option value="self">المتعلم ذاته</option><option value="trainer">الخبير / المدرب</option><option value="peer">قرين / زميل</option></select></label><label>اسم المقيم<input value={evaluatorName} onChange={e=>setEvaluatorName(e.target.value)} placeholder={name||"اسم المقيم"}/></label></div>
    </section>
    {rubricLoading?<section className="rubricLoading"><Sparkles size={22}/><b>جارٍ تجهيز بطاقة التقييم الخاصة بالمنتج…</b><span>نحمّل المعايير المناسبة لهذا المنتج والمستوى.</span></section>:<section className="rubricList mixedRubric">{visibleRubric.map((r,index)=><article key={r.id} className={"rubricCriterion "+(r.essential?"essential":"")}><div className="criterionIndex">{index+1}</div><div className="criterionText"><div><span>{r.section}{r.subsection?" • "+r.subsection:""}</span>{r.essential&&<em>جوهري</em>}</div><p>{r.criterion_template}</p><label className="criterionNote">الملاحظة النوعية<textarea value={criterionNotes[r.id]||""} onChange={e=>setCriterionNotes(n=>({...n,[r.id]:e.target.value}))} placeholder="ما الذي يثبت هذه الدرجة؟ وما الملاحظة التطويرية الواقعية؟"/></label></div><div className="rubricScale" aria-label="التقييم الكمي من صفر إلى ستة">{[0,1,2,3,4,5,6].map(v=><button type="button" key={v} title={["الضعيف","المتأخر","المبتدئ","المتطور","المتقن","المتقدم","الاحترافي"][v]} className={rubricScores[r.id]===v?"selected":""} onClick={()=>setRubricScores(s=>({...s,[r.id]:v}))}><b>{v}</b><small>{["ضعيف","متأخر","مبتدئ","متطور","متقن","متقدم","احترافي"][v]}</small></button>)}</div></article>)}</section>}
    <section className="qualitativeSummary">
      <label><span>ملاحظات عامة على المنتج</span><textarea value={rubricFeedback} onChange={e=>setRubricFeedback(e.target.value)} placeholder="اكتب الصورة الشاملة للأداء: ما الذي تحقق؟ وما الذي يحتاج إلى مراجعة؟"/></label>
      <label><span>أولوية التطوير</span><textarea value={developmentPriority} onChange={e=>setDevelopmentPriority(e.target.value)} placeholder="حدد أهم عنصر يجب تطويره قبل المحاولة التالية."/></label>
      <label><span>التوصية للمحاولة القادمة</span><textarea value={nextRecommendation} onChange={e=>setNextRecommendation(e.target.value)} placeholder="ما الإجراء العملي المحدد الذي ينبغي تنفيذه في النسخة التالية؟"/></label>
    </section>
    <div className="performanceLegend"><span><b>0</b> الضعيف</span><span><b>1</b> المتأخر</span><span><b>2</b> المبتدئ</span><span><b>3</b> المتطور</span><span><b>4</b> المتقن</span><span><b>5</b> المتقدم</span><span><b>6</b> الاحترافي</span></div>
    {lastEval&&<><section className={lastEval.passed?"evaluationResult pass":"evaluationResult retry"}><div><strong>{lastEval.passed?(level===3?"اكتمل مسار تطوير المنتج":"تم اجتياز المستوى "+level):"طوّر المنتج ثم أعد التقييم"}</strong><span>المتوسط {lastEval.average_score} / 6 • المطلوب {lastEval.required_average ?? (level===1?4:level===2?4.5:5)} • المعايير الجوهرية {lastEval.essential_pass?"متحققة":"تحتاج تحسينًا"}</span>{lastEval.previous_average!==null&&<small>المحاولة السابقة {Number(lastEval.previous_average).toFixed(1)} • التغير {lastEval.improvement>0?"+":""}{lastEval.improvement}</small>}</div>{lastEval.passed&&level<3&&<button className="primaryButton noPrint" onClick={openNextLevel}>فتح المستوى {lastEval.next_level} <ArrowLeft size={16}/></button>}</section><section className="developmentReport"><div className="developmentHead"><div><span className="sectionKicker">تقرير التطوير</span><h2>ماذا تقول البطاقة عن منتجك؟</h2></div><strong>{rubricAnalysis.average}<small>/6</small></strong></div><div className="axisAnalysis">{rubricAnalysis.sections.map(s=><div key={s.name}><span>{s.name}</span><div><i style={{width:(s.average/6)*100+"%"}}/></div><b>{s.average}</b></div>)}</div><div className="developmentInsights">{rubricAnalysis.strongest&&<article className="strengthInsight"><span>نقطة قوة</span><b>{rubricAnalysis.strongest.section}{rubricAnalysis.strongest.subsection?" • "+rubricAnalysis.strongest.subsection:""}</b><p>{rubricAnalysis.strongest.criterion_template}</p></article>}<article className="growthInsight"><span>أولوية التطوير قبل المحاولة التالية</span>{rubricAnalysis.weakest.map(r=><div key={r.id}><b>{rubricScores[r.id]}/6</b><p>{r.criterion_template}</p><small>{developmentAdvice(r)}</small></div>)}</article></div>{!lastEval.passed&&<div className="retryPlan"><Sparkles size={18}/><div><b>خطة المحاولة القادمة</b><span>ابدأ بالمعايير الثلاثة الأقل درجة، عدّل المنتج فعليًا، ثم أعد التقييم. الهدف ليس رفع الرقم فقط؛ بل رؤية أثر التحسين في المنتج نفسه.</span></div></div>}</section></>}
    <div className="evaluationActions noPrint">
      {participantProduct?.status==="completed"?<button className="primaryButton" onClick={()=>setStage("diagnosis")}>اكتمل المستوى الثالث — انتقل إلى تشخيص الفصل <ArrowLeft size={17}/></button>:<button className="primaryButton" disabled={busy||!!lastEval?.passed} onClick={submitLevel}>{lastEval&&!lastEval.passed?"إعادة تقييم المستوى "+level:"تقييم المستوى "+level}</button>}
      <button className="outlineButton" onClick={openJourney}><BarChart3 size={16}/> سجل رحلة المنتج</button><button className="outlineButton" onClick={printRubric}><Download size={16}/> تصدير البطاقة PDF</button><button className="outlineButton" onClick={()=>setStage("products")}>تغيير المنتج</button>
    </div>
    {notice&&<div className="loginMessage noPrint">{notice}</div>}
  </main>;

  if(stage==="journey"&&journey) return <main className="workshopPage productJourneyPage">
    <header className="workshopTop journeyTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>رحلة {selectedProduct?.product_name}</b><small>سجل التطوير والمحاولات</small></div></div><div className="journeyTopActions noPrint"><button className="outlineButton" onClick={()=>setStage("evaluate")}><ArrowRight size={16}/> البطاقة</button><button className="outlineButton" onClick={()=>printNamed("التقرير الختامي للورشة")}><Download size={16}/> PDF</button></div></header>
    <section className="journeyHero"><div><span className="sectionKicker">أثر التطوير عبر الزمن</span><h1>من أول محاولة… إلى النسخة الأقوى.</h1><p>هذا السجل لا يعرض درجة نهائية فقط؛ بل يوثق كيف تطور المنتج مع التغذية الراجعة وارتفاع مستوى التحدي.</p></div><div className="journeySummary"><div><span>المحاولات</span><b>{journey.summary.attempts_count}</b></div><div><span>البداية</span><b>{journey.summary.first_average??"—"}<small>/6</small></b></div><div><span>الأحدث</span><b>{journey.summary.latest_average??"—"}<small>/6</small></b></div><div className={(journey.summary.total_improvement??0)>=0?"positive":"negative"}><span>التغير</span><b>{journey.summary.total_improvement!==null?(journey.summary.total_improvement>0?"+":"")+journey.summary.total_improvement:"—"}</b></div></div></section>
    <section className="journeyLevels">{[1,2,3].map(l=>{const ats=journey.attempts.filter((a:any)=>a.level_no===l);const latest=ats[ats.length-1];return <article key={l} className={latest?.passed?"levelComplete":ats.length?"levelTried":""}><div className="journeyLevelNo">L{l}</div><div><span>{l===1?"الأساس":l===2?"الإتقان":"الاحتراف"}</span><b>{ats.length?ats.length+" محاولة":"لم يبدأ"}</b></div>{latest&&<strong>{latest.average_score}<small>/6</small></strong>}</article>})}</section>
    <section className="journeyTimeline"><div className="journeySectionHead"><span className="sectionKicker">الخط الزمني</span><h2>محاولات التطوير</h2></div>{journey.attempts.length===0?<div className="emptyJourney">لم تُسجل محاولات بعد.</div>:journey.attempts.map((a:any,i:number)=><article key={a.id} className="journeyAttempt"><div className="attemptRail"><span>{i+1}</span><i/></div><div className="attemptCard"><div className="attemptHead"><div><span>المحاولة {i+1} • المستوى {a.level_no}</span><b>{new Date(a.created_at).toLocaleDateString("ar-SA")}</b></div><strong className={a.passed?"passed":"retry"}>{a.average_score}<small>/6</small></strong></div><div className="attemptAxes">{(a.sections??[]).map((s:any)=><div key={s.section}><span>{s.section}</span><div><i style={{width:(s.average/6)*100+"%"}}/></div><b>{s.average}</b></div>)}</div>{a.feedback&&<p className="attemptFeedback"><b>ملاحظات التطوير:</b> {a.feedback}</p>}<div className="attemptStatus">{a.passed?<><CheckCircle2 size={15}/> اجتاز هذا المستوى</>:<>يحتاج تطويرًا ثم إعادة المحاولة</>}</div></div></article>)}</section>
    {journey.attempts.length>1&&<section className="beforeAfter"><div><span>البداية</span><strong>{journey.summary.first_average}<small>/6</small></strong></div><ArrowLeft size={25}/><div className="after"><span>أحدث محاولة</span><strong>{journey.summary.latest_average}<small>/6</small></strong></div><div className="beforeAfterMessage"><b>{(journey.summary.total_improvement??0)>0?"التحسن أصبح مرئيًا.":"التطوير عملية مستمرة."}</b><span>{(journey.summary.total_improvement??0)>0?"ارتفع متوسط المنتج "+journey.summary.total_improvement+" نقطة منذ أول محاولة.":"راجع سجل المحاولات وحدد أين يحتاج المنتج إلى تدخل جديد."}</span></div></section>}
    <div className="journeyActions noPrint"><button className="outlineButton" onClick={()=>setStage("evaluate")}><ArrowRight size={16}/> العودة للبطاقة</button>{journey.summary.completed?<button className="primaryButton" onClick={()=>setStage("diagnosis")}>اكتملت رحلة المنتج — تابع الورشة <ArrowLeft size={16}/></button>:<button className="primaryButton" onClick={()=>setStage("evaluate")}>واصل تطوير المنتج <ArrowLeft size={16}/></button>}</div>
  </main>;

  if(stage==="diagnosis") return <main className="workshopPage learningLabPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>مختبر التمايز</b><small>من التشخيص إلى الأهداف</small></div></div><span className="workshopPill">{lessonSubject} • {lessonTitle}</span></header>
    <section className="lessonPicker noPrint"><div><span className="sectionKicker">اختيار الدرس</span><h2>ولّد الحصة من بيانات الفصل الافتراضي</h2><p>غيّر المادة أو الدرس أو عدد الطلاب، وسيُعاد توزيع المسارات كنموذج فوري يمكن للمدرب عرضه أو للمعلم تطويره.</p></div><div className="lessonPickerFields"><label>المادة<input value={lessonSubject} onChange={e=>setLessonSubject(e.target.value)} /></label><label>الدرس<input value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} /></label><label>عدد الطلاب<input type="number" min="3" max="60" value={lessonClassSize} onChange={e=>setLessonClassSize(Math.max(3,Number(e.target.value)||3))}/></label></div></section>
    <section className="labHero"><div><span className="smartBadge"><Target size={15}/> المحطة السادسة</span><h1>بيانات فصل واحد… ثلاث نقاط انطلاق.</h1><p>الموضوع واحد، لكن الاستعداد مختلف. المحرك لا يخفض سقف التعلم؛ بل يغيّر نقطة الدخول وعمق العمليات العقلية.</p></div><div className="classSnapshot"><strong>{lessonClassSize}</strong><span>طالبًا</span><small>تشخيص افتراضي قابل للتعديل</small></div></section>
    <section className="diagnosisGroups">{generatedGroups.map(g=><article key={g.key}><div className="diagnosisGroupTop"><span>{g.title}</span><strong>{g.count}</strong></div><div className="readinessMeter"><i style={{width:g.readiness+"%"}}/></div><small>جاهزية {g.readiness}%</small><h3>{g.range}</h3><p>{g.goal}</p></article>)}</section>
    <section className="labInsight"><Sparkles size={19}/><div><span>قرار المحرك</span><b>المتطلب الجوهري مشترك، بينما تتدرج الأهداف والعمليات من الدعم إلى التحليل والتقويم والإبداع.</b></div></section>
    <div className="labActions"><button className="primaryButton" onClick={()=>setStage("differentiate")}>شاهد تمايز المحتوى والعملية والمنتج <ArrowLeft size={17}/></button></div>
  </main>;

  if(stage==="differentiate") return <main className="workshopPage learningLabPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>موضوع واحد • مسارات مختلفة</small></div></div><span className="workshopPill">المحطة السابعة</span></header>
    <section className="labHero compactLab"><div><h1>{lessonTitle}: الهدف المشترك ثابت، التجربة تتكيف.</h1><p>نغيّر عمق المحتوى، طبيعة العملية، وشكل المنتج القصير وفق الاستعداد وبصمة التعبير.</p></div></section>
    <section className="differentiationMatrix">
      <div className="matrixHeader"><span>المسار</span><span>المحتوى</span><span>العملية</span><span>المنتج</span></div>
      {generatedGroups.map(g=><div className="matrixRow" key={g.key}><b>{g.title}<small>{g.count} طلاب</small></b><p>{g.key==="support"?"مفاهيم أساسية + تمثيل مبسط للتركيب.":g.key==="core"?"تركيب الفيروس ودورة التكاثر مع مقارنة منظمة.":"حالات علمية وقيود التفسير ونقد الأدلة."}</p><p>{g.process}</p><p>{g.product}</p></div>)}
    </section>
    <div className="labActions"><button className="outlineButton" onClick={()=>setStage("diagnosis")}><ArrowRight size={16}/> السابق</button><button className="primaryButton" onClick={()=>setStage("lesson")}>ابنِ الدرس الكامل <ArrowLeft size={17}/></button></div>
  </main>;

  if(stage==="lesson") return <main className="workshopPage learningLabPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>مسودة الدرس</b><small>القرار النهائي للمعلم</small></div></div><span className="workshopPill">المحطة الثامنة</span></header>
    <section className="lessonBuilderHero"><div><span className="smartBadge"><Sparkles size={15}/> مولد الدرس</span><h1>{lessonSubject} — {lessonTitle}</h1><p>مسودة مبنية على التشخيص وبصمات التعبير. راجعها وعدلها؛ المنصة لا تتخذ القرار بدل المعلم.</p></div><div className="draftBadge">مسودة<br/><b>للمراجعة</b></div></section>
    <section className="lessonDraftGrid">
      <article><span>الهدف المركزي</span><h3>أن يفسر الطالب المفاهيم الجوهرية في «{lessonTitle}» ويستخدم الأدلة لتبرير فهمه وتطبيقه.</h3></article>
      <article><span>التهيئة</span><h3>مثير بصري أو سؤال قصير يكشف التصورات السابقة حول «{lessonTitle}».</h3></article>
      <article><span>المحتوى</span><h3>نواة مشتركة في «{lessonTitle}» + دعم مفاهيمي + امتداد تحليلي حسب الجاهزية.</h3></article>
      <article><span>العملية</span><h3>تحليل تمثيل، مقارنة، حالة علمية، ونقاش موجه وفق المسار.</h3></article>
      <article><span>المنتج</span><h3>خريطة مفاهيم / إنفوجرافيك / فيديو أو محاكاة مع حرية الاختيار.</h3></article>
      <article><span>التقويم</span><h3>تذكرة خروج من سؤالين: تفسير + دليل؛ تحدّث خريطة الإتقان للحصة التالية.</h3></article>
    </section>
    <label className="teacherReviewBox"><span>ملاحظتك على المسودة</span><textarea value={lessonNote} onChange={e=>setLessonNote(e.target.value)} placeholder="ما الذي ستعدله قبل التنفيذ؟"/></label>
    <div className="teacherDecision"><CheckCircle2 size={19}/><div><span>مبدأ المنصة</span><b>الذكاء الاصطناعي يقترح ويختصر التحليل، والقرار التربوي يبقى بيد المعلم.</b></div></div>
    <div className="labActions"><button className="outlineButton" onClick={()=>setStage("differentiate")}><ArrowRight size={16}/> السابق</button><button className="primaryButton" onClick={()=>setStage("apply")}>إنهاء التجربة وما بعد الورشة <ArrowLeft size={17}/></button></div>
  </main>;

  if(stage==="finalReport") {
    const primary=result.top[0],second=result.top[1],third=result.top[2];
    const j=journey?.summary;
    return <main className="workshopPage finalExperienceReport">
      <header className="workshopTop finalReportTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>تقرير تجربة المشارك</small></div></div><div className="noPrint finalReportActions"><button className="outlineButton" onClick={()=>window.print()}><Download size={16}/> PDF</button><button className="outlineButton" onClick={()=>setStage("done")}>إنهاء التجربة <ArrowLeft size={16}/></button></div></header>
      <ParticipantJourney active={5}/><section className="finalReportHero"><div><span className="sectionKicker">رحلتي في التمايز</span><h1>{name}</h1><p>{org||"مشارك في الورشة"}</p><div className="finalFingerprintCode">{result.fingerprint}</div><small>بصمتي التعبيرية</small>{qualificationStatus==="qualified"&&<div className="participantQualified">مؤهل ✓</div>}{qualificationStatus==="not_qualified"&&<div className="participantNotQualified">غير مؤهل في هذه الورشة</div>}</div><div className="finalHeroStatement"><span>من التشخيص إلى الدليل</span><b>لم تخبرني البصمة ماذا يجب أن أختار؛ بل ساعدتني على فهم <em>كيف أستطيع أن أضيف</em> داخل المنتج.</b></div></section>
      <section className="finalStoryGrid">
        <article className="identityStory"><span>01 • من أنا؟</span><h2>{styleMeta[primary.code].title}</h2><p>{styleMeta[primary.code].description}</p><div className="finalTopCodes"><b>{primary.code} <small>{primary.mean.toFixed(1)}</small></b><b>{second.code} <small>{second.mean.toFixed(1)}</small></b><b>{third.code} <small>{third.mean.toFixed(1)}</small></b></div></article>
        <article className="choiceStory"><span>02 • ماذا اخترت؟</span><h2>{selectedProduct?.product_name||"منتج متمايز"}</h2><p>اخترت المنتج بحرية من المكتبة، دون أن تحصرني البصمة في نوع واحد من المخرجات.</p><div className="finalRole"><small>الدور الذي تقترحه بصمتي</small><b>{selectedProduct?roleFor([selectedProduct.product_id,selectedProduct.product_name,selectedProduct.style_code]):styleMeta[primary.code].role}</b></div></article>
        <article className="growthStory"><span>03 • كيف تطور المنتج؟</span><h2>{j?.attempts_count??0} محاولات موثقة</h2><div className="growthNumbers"><div><small>البداية</small><b>{j?.first_average??"—"}<em>/6</em></b></div><ArrowLeft size={22}/><div><small>الأحدث</small><b>{j?.latest_average??"—"}<em>/6</em></b></div></div><p>{j?.total_improvement>0?"تحسن المنتج بمقدار "+j.total_improvement+" نقطة منذ أول محاولة.":"يوثق السجل محاولات التطوير والتغذية الراجعة عبر المستويات."}</p></article>
        <article className="evidenceStory"><span>04 • ما الدليل؟</span><h2>أثر يمكن تتبعه</h2><p>الدرجات وحدها ليست الدليل؛ السجل يجمع المحاولات، محاور الأداء، الملاحظات، الانتقال بين مستويات التحدي، وأثر التحسين.</p><div className="evidenceTags"><b>المحتوى</b><b>العرض</b><b>الإبداع</b><b>التأمل</b></div></article>
      </section>
      <section className="finalLearningArc"><div className="finalArcHead"><span className="sectionKicker">ما الذي عشته في الورشة؟</span><h2>التمايز كعملية قرار، لا كقائمة أنشطة.</h2></div><div className="arcSteps"><div><b>1</b><span>شخّصت تفضيلاتي</span></div><i/><div><b>2</b><span>اخترت منتجي بحرية</span></div><i/><div><b>3</b><span>قيّمت المنتج</span></div><i/><div><b>4</b><span>طورت الفجوات</span></div><i/><div><b>5</b><span>ارتفع سقف التحدي</span></div><i/><div><b>6</b><span>وثقت أثر النمو</span></div></div></section>
      <section className="finalQualitativeSummary"><div><span>التقييم النوعي الأخير</span><h2>{lastEval?.feedback||rubricFeedback||"لا توجد ملاحظة نوعية مسجلة بعد."}</h2></div><div><span>أولوية التطوير</span><b>{developmentPriority||"تُحدد من أقل المعايير أداءً في بطاقة المنتج."}</b></div><div><span>المحاولة القادمة</span><b>{nextRecommendation||"طوّر العنصر الأقل أداءً، ثم أعد التقييم وقارن أثر التعديل."}</b></div></section>
      <section className="finalReflection"><Sparkles size={22}/><div><span>الخلاصة التي أحملها معي</span><b>التمايز لا يعني أن يتعلم كل طالب شيئًا مختلفًا؛ بل أن نمنحه نقطة دخول ومسار تعبير وتحديًا مناسبًا، ثم نستخدم الدليل لنقرر خطوته التالية.</b></div></section>
      <footer className="reportFooter"><span>التمايز • diff.t7iq.com</span><span>{session?.title||"ورشة التمايز"}{session?.trainer_names?.length?" • "+session.trainer_names.join("، "):""}</span></footer>
      <div className="finalReportBottom noPrint"><button className="outlineButton" onClick={()=>setStage("journey")}><ArrowRight size={16}/> سجل المنتج</button><button className="primaryButton" onClick={()=>setStage("done")}>إنهاء التجربة <ArrowLeft size={16}/></button></div>
    </main>
  }

  if(stage==="apply") return <main className="participantGate applyGate">
    <section className="participantJoinCard applyCard">
      <div className="differenceMark"><span>ت</span></div>
      <span className="sectionKicker">المحطة التاسعة</span><h1>انتهت الورشة… ويبدأ التطبيق.</h1>
      <p>إذا رغبت في الانضمام إلى الدراسة التطبيقية السنوية، أرسل طلبك. سيُمنح عدد محدود من المعلمين المقبولين حسابًا خلال فترة الدراسة.</p>
      <form onSubmit={apply} className="participantJoinForm">
        <label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <label>الجوال<input value={mobile} onChange={e=>setMobile(e.target.value)}/></label>
        <label>المدرسة / الجهة<input value={org} onChange={e=>setOrg(e.target.value)}/></label>
        <button className="primaryButton" disabled={busy}><GraduationCap size={17}/> إرسال طلب الانضمام</button>
      </form>
      <button className="outlineButton skipApplication" onClick={async()=>{if(participantProduct?.id){try{const d=await api("product_journey",{participant_token:token,participant_product_id:participantProduct.id});setJourney(d)}catch{}}setStage("finalReport")}}>عرض تقريري الختامي</button>
      {notice&&<div className="loginMessage">{notice}</div>}
    </section>
  </main>;

  return <main className="participantGate doneGate">
    <section className="participantJoinCard doneCard">
      <CheckCircle2 size={44}/>
      <span className="sectionKicker">اكتملت رحلة الورشة</span>
      <h1>شكرًا {name}</h1>
      <p>لقد مررت بالمسار كاملًا: التشخيص → البصمة → المنتج → التطوير → التشخيص الصفي → أهداف بلوم → التمايز → الدرس → القرار التعليمي الجديد.</p>
      <div className="finalFingerprint"><span>بصمتك</span><b>{result.fingerprint}</b><small>{selectedProduct?.product_name?"منتجك: "+selectedProduct.product_name:""}</small></div>
      {applicationSent&&<div className="applicationSuccess">تم إرسال طلبك للدراسة التطبيقية السنوية.</div>}
      <div className="doneActions"><button className="outlineButton" onClick={()=>printNamed("تقرير تجربة التمايز")}><Download size={16}/> حفظ التقرير</button><button className="primaryButton" onClick={()=>setStage("report")}>العودة لتقرير البصمة</button></div>
    </section>
  </main>;
}
