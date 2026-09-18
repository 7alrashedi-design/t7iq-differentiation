"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BarChart3, Check, ChevronLeft, Download,
  RotateCcw, Share2, Sparkles, UserRound
} from "lucide-react";
import { products, scoreLabels, styleItems, styleMeta, type StyleCode } from "@/lib/workshop/styleData";

type Scores = Record<StyleCode, number>;

const emptyScores: Scores = {
  W:0,O:0,V:0,T:0,K1a:0,K2c:0,K3s:0,K4p:0,K5h:0,K6m:0
};

function formatCode(code: StyleCode, primary: boolean) {
  if (primary) return code.toUpperCase();
  return code.toLowerCase();
}

function calculateFingerprint(answers: Record<number, number>) {
  const sums: Scores = {...emptyScores};
  const counts: Scores = {...emptyScores};

  styleItems.forEach(item => {
    const v = answers[item.id] ?? 0;
    sums[item.code] += v;
    counts[item.code] += v ? 1 : 0;
  });

  const rows = (Object.keys(sums) as StyleCode[]).map(code => ({
    code,
    score: sums[code],
    mean: counts[code] ? sums[code] / counts[code] : 0
  })).sort((a,b)=>b.mean-a.mean);

  const top = rows.slice(0,3);
  const fingerprint = top.map((x,i)=>formatCode(x.code,i===0)).join("-");
  return { rows, top, fingerprint };
}

function Radar({ rows }:{rows:{code:StyleCode;mean:number}[]}) {
  const size=320, center=160, maxR=118;
  const n=rows.length;
  const point=(index:number,value:number)=>{
    const angle=(-Math.PI/2)+(index/n)*Math.PI*2;
    const r=(value/5)*maxR;
    return [center+Math.cos(angle)*r,center+Math.sin(angle)*r];
  };
  const grid=[1,2,3,4,5].map(level=>rows.map((_,i)=>point(i,level)).map(p=>p.join(",")).join(" "));  
  const data=rows.map((r,i)=>point(i,r.mean)).map(p=>p.join(",")).join(" ");

  return (
    <svg className="fingerprintRadar" viewBox="0 0 320 320" role="img" aria-label="الرسم الراداري لبصمة التعبير">
      {grid.map((g,i)=><polygon key={i} points={g} fill="none" stroke="#dfeaec" strokeWidth="1"/>)}
      {rows.map((_,i)=>{
        const [x,y]=point(i,5);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e5edef" strokeWidth="1"/>;
      })}
      <polygon points={data} fill="rgba(47,143,135,.16)" stroke="#2f8f87" strokeWidth="3"/>
      {rows.map((r,i)=>{
        const [x,y]=point(i,r.mean);
        const [lx,ly]=point(i,5.7);
        return <g key={r.code}>
          <circle cx={x} cy={y} r="4.5" fill="#fff" stroke="#2f8f87" strokeWidth="2"/>
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#526d78">{r.code}</text>
        </g>;
      })}
    </svg>
  );
}

export default function WorkshopDemo(){
  const [step,setStep]=useState<"welcome"|"scale"|"report"|"products">("welcome");
  const [name,setName]=useState("");
  const [org,setOrg]=useState("");
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [current,setCurrent]=useState(0);

  const result=useMemo(()=>calculateFingerprint(answers),[answers]);
  const item=styleItems[current];
  const answered=Object.keys(answers).length;
  const progress=Math.round((answered/styleItems.length)*100);

  const recommendations=useMemo(()=>{
    const topCodes=result.top.map(t=>t.code);
    return products
      .filter(p=>topCodes.includes(p[2] as StyleCode))
      .slice(0,9);
  },[result]);

  function choose(value:number){
    const next={...answers,[item.id]:value};
    setAnswers(next);
    if(current<styleItems.length-1) setCurrent(c=>c+1);
  }

  function previous(){ if(current>0) setCurrent(c=>c-1); }

  function finish(){
    if(Object.keys(answers).length===styleItems.length) setStep("report");
  }

  function reset(){
    setAnswers({}); setCurrent(0); setStep("welcome"); setName(""); setOrg("");
  }

  if(step==="welcome"){
    return <main className="workshopPage">
      <header className="workshopTop">
        <Link href="/" className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>مختبر الورشة</small></div></Link>
        <span className="workshopPill">نسخة اختبارية</span>
      </header>
      <section className="workshopWelcome">
        <div className="workshopWelcomeCopy">
          <span className="smartBadge"><Sparkles size={15}/> المحطة الأولى</span>
          <h1>اكتشف بصمتك في التعبير عن التعلم.</h1>
          <p>ستمر بتجربة قصيرة من 50 عبارة، ثم تحصل فورًا على بصمتك التعبيرية، رسمك البياني، قراءة تفسيرية، ومنتجات يمكنك توظيفها بطريقتك.</p>
          <div className="workshopFacts">
            <span><b>50</b> عبارة</span>
            <span><b>1–5</b> سلم الاستجابة</span>
            <span><b>10</b> أبعاد دقيقة</span>
          </div>
        </div>
        <form className="joinCard" onSubmit={e=>{e.preventDefault();setStep("scale")}}>
          <div className="joinIcon"><UserRound size={23}/></div>
          <h2>الدخول إلى التجربة</h2>
          <p>لا تحتاج إلى إنشاء حساب.</p>
          <label>الاسم<input required value={name} onChange={e=>setName(e.target.value)} placeholder="اكتب اسمك"/></label>
          <label>الجهة<input required value={org} onChange={e=>setOrg(e.target.value)} placeholder="المدرسة / الجهة"/></label>
          <button className="primaryButton workshopStart">ابدأ مقياس «أسلوبي» <ArrowLeft size={17}/></button>
          <small>الإجابة الأولى الأقرب لذهنك هي الأفضل.</small>
        </form>
      </section>
    </main>
  }

  if(step==="scale"){
    return <main className="workshopPage scalePage">
      <header className="scaleHeader">
        <div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>أسلوبي</b><small>بصمة التعبير من خلال المنتج</small></div></div>
        <div className="scaleProgressMeta"><b>{progress}%</b><span>{answered} من 50</span></div>
      </header>
      <div className="scaleProgress"><i style={{width:`${progress}%`}}/></div>

      <section className="questionShell">
        <div className="questionNumber">العبارة {item.id} من 50</div>
        <h1>{item.text}</h1>
        <p>اختر الدرجة الأقرب لما تشعر به الآن، دون تفكير طويل.</p>

        <div className="answerScale">
          {scoreLabels.map(opt=><button
            type="button"
            key={opt.value}
            className={answers[item.id]===opt.value ? "selected":""}
            onClick={()=>choose(opt.value)}
          >
            <strong>{opt.value}</strong><span>{opt.label}</span>
            {answers[item.id]===opt.value && <Check size={15}/>}
          </button>)}
        </div>

        <div className="scaleNav">
          <button className="outlineButton" onClick={previous} disabled={current===0}><ArrowRight size={16}/> السابق</button>
          <span>يتم الحفظ أثناء التقدم</span>
          {current===styleItems.length-1
            ? <button className="primaryButton" onClick={finish} disabled={answered<styleItems.length}>إظهار بصمتي <Sparkles size={16}/></button>
            : <button className="outlineButton" onClick={()=>setCurrent(c=>Math.min(c+1,49))}>التالي <ArrowLeft size={16}/></button>}
        </div>
      </section>
    </main>
  }

  if(step==="report"){
    const primary=result.top[0];
    const second=result.top[1];
    const third=result.top[2];
    return <main className="reportPage">
      <header className="reportTop">
        <div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>تقرير بصمة التعبير</small></div></div>
        <div className="reportActions">
          <button className="outlineButton" onClick={()=>window.print()}><Download size={16}/> PDF</button>
          <button className="outlineButton" onClick={()=>navigator.share?.({title:"بصمتي التعبيرية",text:`بصمتي التعبيرية في منصة التمايز: ${result.fingerprint}`})}><Share2 size={16}/> مشاركة</button>
        </div>
      </header>

      <section className="reportHero">
        <div>
          <span className="reportEyebrow">بصمتك التعبيرية</span>
          <div className="fingerprintCode">{result.fingerprint}</div>
          <h1>{name}</h1>
          <p>{org}</p>
        </div>
        <div className="fingerprintSummary">
          <span>النمط الأعلى</span>
          <b>{styleMeta[primary.code].title}</b>
          <small>متوسط {primary.mean.toFixed(1)} من 5</small>
        </div>
      </section>

      <section className="reportGrid">
        <article className="reportCard radarCard">
          <div className="reportCardHead"><div><span>الملف الكمي</span><h2>خريطة بصمتك</h2></div><BarChart3 size={21}/></div>
          <Radar rows={result.rows}/>
        </article>

        <article className="reportCard rankingCard">
          <div className="reportCardHead"><div><span>الترتيب</span><h2>أبعاد التعبير</h2></div></div>
          <div className="rankingList">
            {result.rows.map((r,i)=><div key={r.code}>
              <span className="rankNo">{i+1}</span>
              <div className="rankText"><b>{styleMeta[r.code].title}</b><span>{r.code}</span></div>
              <div className="rankBar"><i style={{width:`${(r.mean/5)*100}%`}}/></div>
              <strong>{r.mean.toFixed(1)}</strong>
            </div>)}
          </div>
        </article>

        <article className="reportCard narrativeCard">
          <span className="sectionKicker">اقرأ نفسك من خلال النتيجة</span>
          <h2>ماذا تقول بصمتك؟</h2>
          <p><b>{styleMeta[primary.code].title}</b> هو الأكثر حضورًا لديك؛ {styleMeta[primary.code].description}</p>
          <p>ويظهر بعده <b>{styleMeta[second.code].title}</b> ثم <b>{styleMeta[third.code].title}</b>، وهذا يعني أن طريقتك في التعبير ليست محصورة في قالب واحد، بل تجمع بين أكثر من قناة يمكن توظيفها داخل المنتج نفسه.</p>
          <div className="narrativeTiles">
            <div><span>دور قد يناسبك</span><b>{styleMeta[primary.code].role}</b></div>
            <div><span>مساحة نمو</span><b>{styleMeta[primary.code].growth}</b></div>
          </div>
          <small>هذه البصمة تصف تفضيلاتك الحالية في التعبير عن التعلم، ولا تمثل حكمًا ثابتًا على قدراتك.</small>
        </article>

        <article className="reportCard topThreeCard">
          <span className="sectionKicker">أعلى ثلاثة أبعاد</span>
          <div className="topThree">
            {result.top.map((r,i)=><div key={r.code} className={i===0?"primaryStyle":""}>
              <span>{i+1}</span><b>{r.code}</b><small>{styleMeta[r.code].shortTitle}</small><strong>{r.mean.toFixed(1)}</strong>
            </div>)}
          </div>
        </article>
      </section>

      <section className="reportNext">
        <div><span className="sectionKicker">المحطة التالية</span><h2>حوّل البصمة إلى منتج</h2><p>سترى منتجات قريبة من تفضيلاتك، لكنك حر في اختيار أي منتج. دور البصمة هو مساعدتك في معرفة كيف تسهم داخله.</p></div>
        <button className="primaryButton" onClick={()=>setStep("products")}>استكشف المنتجات <ArrowLeft size={17}/></button>
      </section>

      <footer className="reportFooter"><span>التمايز • diff.t7iq.com</span><span>المدرب: يحدد من إعدادات الورشة</span></footer>
    </main>
  }

  return <main className="workshopPage productPage">
    <header className="workshopTop">
      <div className="platformBrand compact"><div className="differenceMark small"><span>ت</span></div><div><b>التمايز</b><small>من البصمة إلى المنتج</small></div></div>
      <button className="outlineButton" onClick={()=>setStep("report")}><ChevronLeft size={16}/> تقريري</button>
    </header>

    <section className="productHero">
      <span className="smartBadge"><Sparkles size={15}/> بصمتك {result.fingerprint}</span>
      <h1>ابدأ من المنتج الذي يشعل فضولك.</h1>
      <p>هذه المنتجات مقترحة لأنها تتقاطع مع أعلى أبعاد بصمتك. يمكنك رغم ذلك اختيار أي منتج آخر؛ البصمة تساعدك في تحديد الدور والطريقة، لا في تقييد الاختيار.</p>
    </section>

    <section className="productGrid">
      {recommendations.map((p,i)=><article key={p[0]} className="productCard">
        <div className="productCode">{p[0]}</div>
        <h2>{p[1]}</h2>
        <p>ملاءمة عالية مع بعد <b>{styleMeta[p[2] as StyleCode].shortTitle}</b>.</p>
        <div className="productRole"><span>دور مقترح</span><b>{styleMeta[p[2] as StyleCode].role.split("،")[0]}</b></div>
        <button className="outlineButton">اختيار المنتج</button>
        {i<3 && <span className="recommendedTag">مقترح لك</span>}
      </article>)}
    </section>

    <section className="productPreviewLevels">
      <div><span>L1</span><b>أساس المنتج</b><small>المحتوى + وضوح الفكرة</small></div>
      <i/>
      <div><span>L2</span><b>إتقان المنتج</b><small>العرض + التفاصيل + التماسك</small></div>
      <i/>
      <div><span>L3</span><b>المستوى الاحترافي</b><small>العمق + الإبداع + التأمل</small></div>
    </section>

    <div className="workshopBottomActions"><button className="outlineButton" onClick={reset}><RotateCcw size={16}/> إعادة الاختبار</button></div>
  </main>
}
