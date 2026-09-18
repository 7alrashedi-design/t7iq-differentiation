"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2, Download,
  FlaskConical, GraduationCap, Layers3, Share2, Sparkles, Target, UsersRound
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { products, scoreLabels, styleItems, styleMeta, type StyleCode } from "@/lib/workshop/styleData";

type Stage="join"|"scale"|"report"|"products"|"evaluate"|"diagnosis"|"differentiate"|"lesson"|"apply"|"done";
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
  const [lastEval,setLastEval]=useState<any>(null);
  const [lessonNote,setLessonNote]=useState("");
  const [applicationSent,setApplicationSent]=useState(false);

  const result=useMemo(()=>calculate(answers),[answers]);
  const answered=Object.keys(answers).length;
  const progress=Math.round((answered/50)*100);
  const item=styleItems[current];

  async function api(action:string,payload:any={}){
    const {data,error}=await supabase.functions.invoke("workshop-public",{body:{action,...payload}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  }

  useEffect(()=>{
    api("session",{code}).then(d=>setSession(d.session)).catch(()=>setNotice("الجلسة غير موجودة أو مغلقة حاليًا."));
  },[code]);

  async function join(e:FormEvent){
    e.preventDefault();setBusy(true);setNotice("");
    try{
      const d=await api("join",{code,full_name:name,organization_name:org,email:email||null,mobile:mobile||null});
      const t=d.participant.participant_token;
      setToken(t);
      localStorage.setItem("tamayoz-workshop-"+code,t);
      setStage("scale");
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر الدخول.")}finally{setBusy(false)}
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
      setStage("report");
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر حفظ النتيجة.")}finally{setBusy(false)}
  }

  const productRoles:Record<StyleCode,string>={W:"كاتب/موثق",O:"متحدث/محاور",V:"مصمم بصري",T:"منفذ تقني",K1a:"مصمم فني",K2c:"منظم/مسوق",K3s:"منسق أثر",K4p:"مؤدٍ/ممثل",K5h:"صانع/منفذ",K6m:"صوت/إيقاع"};
  const productGroups=useMemo(()=>[
    {code:"W" as StyleCode,label:"كتابي"},{code:"O" as StyleCode,label:"شفهي"},{code:"V" as StyleCode,label:"مرئي/صوتي"},{code:"T" as StyleCode,label:"تقني"},{code:"K" as const,label:"حركي"}
  ],[]);
  const [productFilter,setProductFilter]=useState<"ALL"|"W"|"O"|"V"|"T"|"K">("ALL");
  const visibleProducts=useMemo(()=>products.filter(p=>productFilter==="ALL" ? true : productFilter==="K" ? String(p[0]).startsWith("K-") : p[2]===productFilter),[productFilter]);
  const topCodes=result.top.map(t=>t.code);
  function fitLabel(p:any){return topCodes.includes(p[2] as StyleCode)?"يلائم بصمتك مباشرة":"يمكنك توظيف بصمتك داخله"}
  function roleFor(p:any){return productRoles[result.top[0].code]}

  async function selectProduct(p:any){
    setBusy(true);setNotice("");
    try{
      const d=await api("select_product",{participant_token:token,product_id:p[0]});
      setSelectedProduct(d.product);
      setParticipantProduct(d.participant_product);
      setLevel(d.participant_product.current_level);
      await loadRubric(d.participant_product.current_level,d.product.product_name);
      setStage("evaluate");
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر اختيار المنتج.")}finally{setBusy(false)}
  }

  async function loadRubric(lvl:number,productName?:string){
    const d=await api("rubric",{participant_token:token,level_no:lvl});
    const rows=(d.rubric??[]).map((r:Rubric)=>({...r,criterion_template:r.criterion_template.replaceAll("{product}",productName??selectedProduct?.product_name??"المنتج")}));
    setRubric(rows);
    setRubricScores({});
  }

  async function submitLevel(){
    if(rubric.some(r=>rubricScores[r.id]===undefined)){setNotice("قيّم جميع المعايير قبل الإرسال.");return}
    setBusy(true);setNotice("");
    try{
      const d=await api("submit_evaluation",{
        participant_token:token,
        participant_product_id:participantProduct.id,
        level_no:level,
        scores:rubric.map(r=>({rubric_template_id:r.id,score:rubricScores[r.id]}))
      });
      setLastEval(d);
      if(d.passed){
        if(d.status==="completed"){
          setParticipantProduct({...participantProduct,current_level:3,status:"completed"});
        }else{
          setLevel(d.next_level);
          setParticipantProduct({...participantProduct,current_level:d.next_level,status:"in_progress"});
          await loadRubric(d.next_level,selectedProduct.product_name);
        }
      }
    }catch(e){setNotice(e instanceof Error?e.message:"تعذر حفظ التقييم.")}finally{setBusy(false)}
  }

  async function apply(e:FormEvent){
    e.preventDefault();setBusy(true);setNotice("");
    try{
      await api("apply",{participant_token:token,email,mobile,school_name:org,note:lessonNote,interested:true});
      setApplicationSent(true);setStage("done");
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
      <form onSubmit={join} className="participantJoinForm">
        <label>الاسم<input required value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم"/></label>
        <label>الجهة<input value={org} onChange={e=>setOrg(e.target.value)} placeholder="المدرسة / الجهة"/></label>
        <div className="joinOptional"><label>البريد <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="اختياري"/></label><label>الجوال<input value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="اختياري"/></label></div>
        <button className="primaryButton" disabled={busy}>دخول الجلسة <ArrowLeft size={17}/></button>
      </form>
      {notice&&<div className="loginMessage">{notice}</div>}
    </section>
  </main>;

  if(stage==="scale") return <main className="workshopPage scalePage">
    <header className="scaleHeader"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>أسلوبي</b><small>مقياس أسلوب التعبير</small></div></div><div className="scaleProgressMeta"><b>{progress}%</b><span>{answered} من 50</span></div></header>
    <div className="scaleProgress"><i style={{width:progress+"%"}}/></div>
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
      <header className="reportTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>تقرير بصمة التعبير</small></div></div><div className="reportIdentity"><b>{session?.title || "ورشة التمايز"}</b><span>{session?.trainer_names?.length ? "المدرب/المدربون: "+session.trainer_names.join("، ") : "ورشة التمايز"}</span><small>{new Date().toLocaleDateString("ar-SA",{year:"numeric",month:"long",day:"numeric"})}</small></div><div className="reportActions"><button className="outlineButton" onClick={()=>window.print()}><Download size={16}/> PDF</button><button className="outlineButton" onClick={()=>navigator.share?.({title:"بصمتي التعبيرية",text:"بصمتي التعبيرية في منصة التمايز: "+result.fingerprint})}><Share2 size={16}/> مشاركة</button></div></header>
      <section className="reportHero"><div className="reportHeroMain"><span className="reportEyebrow">بصمتك التعبيرية</span><div className="fingerprintCode">{result.fingerprint}</div><div className="reportPerson"><h1>{name}</h1><p>{org || "مشارك في الورشة"}</p></div><small className="fingerprintTagline">لكل متعلم طريقة فريدة للتعبير</small></div><div className="fingerprintVisual"><div className="fingerprintGlyph">◎</div><span>{primary.code}</span></div><div className="fingerprintSummary"><span>البعد الأكثر حضورًا</span><b>{styleMeta[primary.code].title}</b><strong>{primary.mean.toFixed(1)}<em>/5</em></strong><small>{styleMeta[primary.code].shortTitle}</small></div></section>
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
    <section className="productHero"><span className="smartBadge"><Sparkles size={15}/> بصمتك {result.fingerprint}</span><h1>اختر المنتج الذي يشعل فضولك.</h1><p>كل المنتجات متاحة لك. بصمتك لا تقيد اختيارك؛ بل تساعدك في تحديد <b>الدور الذي تضيف به قوتك</b> داخل المنتج أو فريق العمل.</p></section>
    <nav className="productFilters"><button className={productFilter==="ALL"?"active":""} onClick={()=>setProductFilter("ALL")}>الكل <small>{products.length}</small></button>{productGroups.map(g=><button key={g.code} className={productFilter===g.code?"active":""} onClick={()=>setProductFilter(g.code)}>{g.label}</button>)}</nav>
    <div className="productChoiceHint"><UsersRound size={18}/><div><b>فكر بالمنتج أولًا، ثم بالدور.</b><span>مثال: صاحب البصمة الكتابية يمكنه اختيار «فيلم» ويكون دوره كتابة السيناريو أو توثيق المحتوى، بينما يكمل زملاؤه الأدوار البصرية والتقنية والأدائية.</span></div></div>
    <section className="productGrid allProductGrid">{visibleProducts.map((p:any)=><article key={p[0]} className={"productCard "+(topCodes.includes(p[2] as StyleCode)?"directFit":"")}><div className="productCardTop"><span className="productCode">{p[0]}</span>{topCodes.includes(p[2] as StyleCode)&&<span className="recommendedTag">قريب من بصمتك</span>}</div><h2>{p[1]}</h2><p>{fitLabel(p)}</p><div className="productRole"><span>دورك المقترح وفق بصمتك</span><b>{roleFor(p)}</b></div><button className="outlineButton" disabled={busy} onClick={()=>selectProduct(p)}>اختيار هذا المنتج</button></article>)}</section>
    {notice&&<div className="loginMessage">{notice}</div>}
  </main>;

  if(stage==="evaluate") return <main className="workshopPage evaluationPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>{selectedProduct?.product_name}</b><small>تطوير المنتج • المستوى L{level}</small></div></div><span className="levelBadge">L{level}</span></header>
    <section className="evaluationHero"><span className="sectionKicker">أداة تطوير المنتج</span><h1>{level===1?"ابنِ الأساس":level===2?"ارفع مستوى الإتقان":"اصنع النسخة الاحترافية"}</h1><p>قيّم منتجك من 0 إلى 6. الانتقال يتطلب متوسطًا لا يقل عن 4 وتحقيق المعايير الجوهرية في المحتوى.</p></section>
    <section className="rubricList">{rubric.map(r=><article key={r.id} className={"rubricCriterion "+(r.essential?"essential":"")}><div className="criterionText"><div><span>{r.section}{r.subsection?" • "+r.subsection:""}</span>{r.essential&&<em>جوهري</em>}</div><p>{r.criterion_template}</p></div><div className="rubricScale">{[0,1,2,3,4,5,6].map(v=><button key={v} className={rubricScores[r.id]===v?"selected":""} onClick={()=>setRubricScores(s=>({...s,[r.id]:v}))}>{v}</button>)}</div></article>)}</section>
    <div className="performanceLegend"><span><b>0–1</b> يحتاج بناء</span><span><b>2–3</b> في طور التطور</span><span><b>4</b> إتقان</span><span><b>5</b> متقدم</span><span><b>6</b> احتراف</span></div>
    {lastEval&&<div className={lastEval.passed?"evaluationResult pass":"evaluationResult retry"}><strong>{lastEval.passed?"تم اجتياز المستوى":"طوّر المنتج ثم أعد المحاولة"}</strong><span>المتوسط {lastEval.average_score} / 6 • المعايير الجوهرية {lastEval.essential_pass?"متحققة":"تحتاج تحسينًا"}</span></div>}
    <div className="evaluationActions">
      {participantProduct?.status==="completed"?<button className="primaryButton" onClick={()=>setStage("diagnosis")}>اكتمل L3 — انتقل إلى تشخيص الفصل <ArrowLeft size={17}/></button>:<button className="primaryButton" disabled={busy} onClick={submitLevel}>تقييم المستوى {level}</button>}
      <button className="outlineButton" onClick={()=>setStage("products")}>تغيير المنتج</button>
    </div>
    {notice&&<div className="loginMessage">{notice}</div>}
  </main>;

  if(stage==="diagnosis") return <main className="workshopPage learningLabPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>مختبر التمايز</b><small>من التشخيص إلى الأهداف</small></div></div><span className="workshopPill">أحياء 1 • الفيروسات</span></header>
    <section className="labHero"><div><span className="smartBadge"><Target size={15}/> المحطة السادسة</span><h1>بيانات فصل واحد… ثلاث نقاط انطلاق.</h1><p>الموضوع واحد، لكن الاستعداد مختلف. المحرك لا يخفض سقف التعلم؛ بل يغيّر نقطة الدخول وعمق العمليات العقلية.</p></div><div className="classSnapshot"><strong>28</strong><span>طالبًا</span><small>تشخيص افتراضي للورشة</small></div></section>
    <section className="diagnosisGroups">{diagnosisGroups.map(g=><article key={g.key}><div className="diagnosisGroupTop"><span>{g.title}</span><strong>{g.count}</strong></div><div className="readinessMeter"><i style={{width:g.readiness+"%"}}/></div><small>جاهزية {g.readiness}%</small><h3>{g.range}</h3><p>{g.goal}</p></article>)}</section>
    <section className="labInsight"><Sparkles size={19}/><div><span>قرار المحرك</span><b>المتطلب الجوهري مشترك، بينما تتدرج الأهداف والعمليات من الدعم إلى التحليل والتقويم والإبداع.</b></div></section>
    <div className="labActions"><button className="primaryButton" onClick={()=>setStage("differentiate")}>شاهد تمايز المحتوى والعملية والمنتج <ArrowLeft size={17}/></button></div>
  </main>;

  if(stage==="differentiate") return <main className="workshopPage learningLabPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>موضوع واحد • مسارات مختلفة</small></div></div><span className="workshopPill">المحطة السابعة</span></header>
    <section className="labHero compactLab"><div><h1>الفيروسات: الهدف المشترك ثابت، التجربة تتكيف.</h1><p>نغيّر عمق المحتوى، طبيعة العملية، وشكل المنتج القصير وفق الاستعداد وبصمة التعبير.</p></div></section>
    <section className="differentiationMatrix">
      <div className="matrixHeader"><span>المسار</span><span>المحتوى</span><span>العملية</span><span>المنتج</span></div>
      {diagnosisGroups.map(g=><div className="matrixRow" key={g.key}><b>{g.title}<small>{g.count} طلاب</small></b><p>{g.key==="support"?"مفاهيم أساسية + تمثيل مبسط للتركيب.":g.key==="core"?"تركيب الفيروس ودورة التكاثر مع مقارنة منظمة.":"حالات علمية وقيود التفسير ونقد الأدلة."}</p><p>{g.process}</p><p>{g.product}</p></div>)}
    </section>
    <div className="labActions"><button className="outlineButton" onClick={()=>setStage("diagnosis")}><ArrowRight size={16}/> السابق</button><button className="primaryButton" onClick={()=>setStage("lesson")}>ابنِ الدرس الكامل <ArrowLeft size={17}/></button></div>
  </main>;

  if(stage==="lesson") return <main className="workshopPage learningLabPage">
    <header className="workshopTop"><div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>مسودة الدرس</b><small>القرار النهائي للمعلم</small></div></div><span className="workshopPill">المحطة الثامنة</span></header>
    <section className="lessonBuilderHero"><div><span className="smartBadge"><Sparkles size={15}/> مولد الدرس</span><h1>أحياء 1 — الفيروسات</h1><p>مسودة مبنية على التشخيص وبصمات التعبير. راجعها وعدلها؛ المنصة لا تتخذ القرار بدل المعلم.</p></div><div className="draftBadge">مسودة<br/><b>للمراجعة</b></div></section>
    <section className="lessonDraftGrid">
      <article><span>الهدف المركزي</span><h3>أن يفسر الطالب بنية الفيروس وآلية تكاثره ويستخدم الأدلة لتبرير تفسيره.</h3></article>
      <article><span>التهيئة</span><h3>صورة/مقطع قصير ثم سؤال: لماذا لا يصنف الفيروس كخلية كاملة؟</h3></article>
      <article><span>المحتوى</span><h3>نواة مشتركة + دعم مفاهيمي + امتداد تحليلي حسب الجاهزية.</h3></article>
      <article><span>العملية</span><h3>تحليل تمثيل، مقارنة، حالة علمية، ونقاش موجه وفق المسار.</h3></article>
      <article><span>المنتج</span><h3>خريطة مفاهيم / إنفوجرافيك / فيديو أو محاكاة مع حرية الاختيار.</h3></article>
      <article><span>التقويم</span><h3>تذكرة خروج من سؤالين: تفسير + دليل؛ تحدّث خريطة الإتقان للحصة التالية.</h3></article>
    </section>
    <label className="teacherReviewBox"><span>ملاحظتك على المسودة</span><textarea value={lessonNote} onChange={e=>setLessonNote(e.target.value)} placeholder="ما الذي ستعدله قبل التنفيذ؟"/></label>
    <div className="teacherDecision"><CheckCircle2 size={19}/><div><span>مبدأ المنصة</span><b>الذكاء الاصطناعي يقترح ويختصر التحليل، والقرار التربوي يبقى بيد المعلم.</b></div></div>
    <div className="labActions"><button className="outlineButton" onClick={()=>setStage("differentiate")}><ArrowRight size={16}/> السابق</button><button className="primaryButton" onClick={()=>setStage("apply")}>إنهاء التجربة وما بعد الورشة <ArrowLeft size={17}/></button></div>
  </main>;

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
      <button className="outlineButton skipApplication" onClick={()=>setStage("done")}>إنهاء دون تقديم طلب</button>
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
      <div className="doneActions"><button className="outlineButton" onClick={()=>window.print()}><Download size={16}/> حفظ التقرير</button><button className="primaryButton" onClick={()=>setStage("report")}>العودة لتقرير البصمة</button></div>
    </section>
  </main>;
}
