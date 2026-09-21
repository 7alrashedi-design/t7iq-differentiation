"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, BarChart3, CheckCircle2, Download, GraduationCap, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Participant={
  id:string;session_id:string;full_name:string;organization_name:string|null;email:string|null;mobile:string|null;
  joined_at:string;completed_at:string|null;qualification_status:string;qualified_at:string|null;qualification_note:string|null
};
type Fingerprint={fingerprint_code:string;primary_code:string;secondary_codes:string[];dimension_scores:any;generated_at:string};
type Product={id:string;product_id:string;current_level:number;status:string;selected_at:string};
type ProductInfo={product_id:string;product_name:string;style_category:string;style_code:string};
type Attempt={id:string;level_no:number;evaluator_type:string;average_score:number|null;essential_pass:boolean|null;passed:boolean|null;feedback:string|null;evaluator_name:string|null;development_priority:string|null;next_recommendation:string|null;created_at:string};

export default function ParticipantReport(){
  const params=useParams<{id:string;participantId:string}>();
  const sessionId=params.id, participantId=params.participantId;
  const [participant,setParticipant]=useState<Participant|null>(null);
  const [fingerprint,setFingerprint]=useState<Fingerprint|null>(null);
  const [product,setProduct]=useState<Product|null>(null);
  const [productInfo,setProductInfo]=useState<ProductInfo|null>(null);
  const [attempts,setAttempts]=useState<Attempt[]>([]);
  const [sessionTitle,setSessionTitle]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{void load()},[participantId]);

  async function load(){
    const s=getSupabaseBrowserClient();
    const [{data:p},{data:fp},{data:pp},{data:ss}]=await Promise.all([
      s.from("workshop_participants").select("id,session_id,full_name,organization_name,email,mobile,joined_at,completed_at,qualification_status,qualified_at,qualification_note").eq("id",participantId).eq("session_id",sessionId).maybeSingle(),
      s.from("fingerprint_results").select("fingerprint_code,primary_code,secondary_codes,dimension_scores,generated_at").eq("participant_id",participantId).maybeSingle(),
      s.from("participant_products").select("id,product_id,current_level,status,selected_at").eq("participant_id",participantId).maybeSingle(),
      s.from("workshop_sessions").select("title").eq("id",sessionId).maybeSingle()
    ]);
    setParticipant(p as Participant|null);setFingerprint(fp as Fingerprint|null);setProduct(pp as Product|null);setSessionTitle(ss?.title||"");
    if(pp?.product_id){
      const [{data:pi},{data:at}]=await Promise.all([
        s.from("product_catalog").select("product_id,product_name,style_category,style_code").eq("product_id",pp.product_id).maybeSingle(),
        s.from("product_evaluation_attempts").select("id,level_no,evaluator_type,average_score,essential_pass,passed,feedback,evaluator_name,development_priority,next_recommendation,created_at").eq("participant_product_id",pp.id).order("created_at")
      ]);
      setProductInfo(pi as ProductInfo|null);setAttempts((at??[]) as Attempt[]);
    }
    setLoading(false);
  }

  const dims=useMemo(()=>{
    if(!fingerprint?.dimension_scores) return [];
    return Object.entries(fingerprint.dimension_scores).map(([code,v]:any)=>({code,mean:Number(v?.mean??0)})).sort((a,b)=>b.mean-a.mean);
  },[fingerprint]);

  if(loading) return <main className="roleGate"><div className="roleGateCard"><h1>جارٍ إعداد تقرير المتدرب</h1></div></main>;
  if(!participant) return <main className="roleGate"><div className="roleGateCard"><h1>تعذر فتح التقرير</h1><p>تحقق من صلاحياتك أو من ارتباط المتدرب بهذه الجلسة.</p><Link className="outlineButton" href={"/trainer/session/"+sessionId}>العودة</Link></div></main>;

  const qual=participant.qualification_status==="qualified"?"مؤهل":participant.qualification_status==="not_qualified"?"غير مؤهل":participant.qualification_status==="completed"?"بانتظار الاعتماد":"قيد التنفيذ";

  return <main className="roleWorkspace participantAdminReport">
    <header className="roleHero">
      <div className="roleBrand"><div className="differenceMark"><span>ت</span></div><div><span className="sectionKicker">تقرير متدرب</span><h1>{participant.full_name}</h1><p>{sessionTitle} {participant.organization_name?"• "+participant.organization_name:""}</p></div></div>
      <div className="roleHeroActions"><Link className="outlineButton" href={"/trainer/session/"+sessionId}><ArrowRight/> الجلسة</Link><button className="primaryButton" onClick={()=>window.print()}><Download/> PDF</button></div>
    </header>

    <section className="rolePulseGrid">
      <article><div className="pulseIcon mint"><Sparkles/></div><div><strong>{fingerprint?.fingerprint_code||"—"}</strong><span>البصمة</span></div></article>
      <article><div className="pulseIcon blue"><BarChart3/></div><div><strong>{product?"L"+product.current_level:"—"}</strong><span>مستوى المنتج</span></div></article>
      <article><div className="pulseIcon violet"><CheckCircle2/></div><div><strong>{attempts.filter(x=>x.passed).length}</strong><span>محاولات ناجحة</span></div></article>
      <article><div className="pulseIcon amber"><GraduationCap/></div><div><strong>{qual}</strong><span>حالة التأهيل</span></div></article>
    </section>

    <section className="trainingReportGrid">
      <article className="reportPanel">
        <div className="reportPanelHead"><div><span className="sectionKicker">بصمتي</span><h2>{fingerprint?.fingerprint_code||"لم تكتمل بعد"}</h2></div><Sparkles/></div>
        <div className="fingerprintBars">{dims.map(d=><div key={d.code}><div className="fingerprintBarLabel"><b>{d.code}</b><span>{d.mean.toFixed(1)} / 5</span></div><i><em style={{width:Math.min(100,d.mean/5*100)+"%"}}/></i></div>)}</div>
      </article>
      <article className="reportPanel">
        <div className="reportPanelHead"><div><span className="sectionKicker">المنتج</span><h2>{productInfo?.product_name||"لم يحدد"}</h2></div><BarChart3/></div>
        <div className="participantProductSummary">
          <div><span>الحالة</span><b>{product?.status==="completed"?"مكتمل":product?"قيد التطوير":"—"}</b></div>
          <div><span>المستوى الحالي</span><b>{product?"L"+product.current_level:"—"}</b></div>
          <div><span>الفئة</span><b>{productInfo?.style_category||"—"}</b></div>
          <div><span>رمز الأسلوب</span><b>{productInfo?.style_code||"—"}</b></div>
        </div>
      </article>
    </section>

    <section className="roleSection">
      <div className="roleSectionHead"><div><span className="sectionKicker">سجل التطوير</span><h2>المحاولات والتغذية الراجعة</h2></div><span>{attempts.length} محاولة</span></div>
      <div className="attemptTimeline">
        {attempts.map((a,i)=><article key={a.id}>
          <div className={"attemptIndex "+(a.passed?"passed":"")}><span>{i+1}</span></div>
          <div className="attemptContent"><div className="attemptTop"><b>المستوى L{a.level_no}</b><span>{a.evaluator_type==="self"?"تقييم ذاتي":a.evaluator_type==="trainer"?"تقييم المدرب":"تقييم زميل"}</span><strong>{a.average_score!=null?Number(a.average_score).toFixed(1)+"/6":"—"}</strong></div>
          {a.feedback&&<p>{a.feedback}</p>}
          {a.development_priority&&<small><b>أولوية التطوير:</b> {a.development_priority}</small>}
          {a.next_recommendation&&<small><b>الخطوة التالية:</b> {a.next_recommendation}</small>}
          </div>
        </article>)}
        {attempts.length===0&&<div className="roleEmpty"><BarChart3/><h3>لا توجد محاولات تقييم بعد</h3><p>ستظهر هنا بمجرد بدء تطوير المنتج.</p></div>}
      </div>
    </section>

    <footer className="reportFooter"><span>التمايز • تقرير متدرب</span><span>{qual}</span></footer>
  </main>
}
