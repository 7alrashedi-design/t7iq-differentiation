"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";
const labels=["استعداد النشاط","K — ماذا تعرف؟","W — ماذا تريد أن تعرف؟","L — ماذا تعلمت؟","R — الأسئلة غير المجابة"];
const durations=[0,120,120,180,0];
export default function KWLRTrainer(){
 const {id}=useParams<{id:string}>();
 const db=useMemo(()=>getSupabaseBrowserClient(),[]);
 const [code,setCode]=useState(""),[qr,setQr]=useState(""),[state,setState]=useState<any>(null),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now());
 useEffect(()=>{void db.from("workshop_sessions").select("session_code").eq("id",id).single().then(({data,error})=>{if(data)setCode(data.session_code);else setNotice(error?.message||"تعذر تحميل الورشة")})},[id,db]);
 useEffect(()=>{if(!code)return;void QRCode.toDataURL(window.location.origin+"/w/"+code+"/kwlr",{width:320,margin:1}).then(setQr).catch(()=>setQr(""))},[code]);
 async function refresh(){if(!code)return;const {data,error}=await db.functions.invoke("workshop-public",{body:{action:"kwlr_state",code,trainer_view:true}});if(error||data?.error){setNotice(data?.error||"تعذر قراءة النشاط؛ تحقق من صلاحية المدرب");return}setState(data);setNotice("")}
 useEffect(()=>{void refresh();const t=setInterval(()=>{setNow(Date.now());void refresh()},2000);return()=>clearInterval(t)},[code]);
 const entries=state?.entries??[],stage=Number(state?.run?.stage??0),end=state?.run?.stage_ends_at;
 const remaining=end?Math.max(0,Math.ceil((new Date(end).getTime()-now)/1000)):0;
 const finished=stage>=1&&stage<=3&&remaining===0;
 const questions=entries.filter((x:any)=>x.stage===2);
 const linked=new Set(entries.filter((x:any)=>x.stage===3&&x.related_question_id).map((x:any)=>x.related_question_id));
 const unanswered=questions.filter((x:any)=>!linked.has(x.id));
 const currentEntries=stage===4?unanswered:entries.filter((x:any)=>x.stage===stage);
 const counts=state?.counts??{},total=Object.values(counts).reduce((n:number,v:any)=>n+Number(v||0),0);
 async function control(next:number){
  if(!code||busy||next!==stage+1||(stage>0&&!finished))return;
  setBusy(true);
  const {data,error}=await db.functions.invoke("workshop-public",{body:{action:"kwlr_control",code,stage:next}});
  setBusy(false);
  if(error||data?.error){setNotice(data?.error||"تعذر الانتقال إلى المرحلة التالية");return}
  await refresh();
 }
 return <main dir="rtl" style={{fontFamily:"El Messiri,Tahoma,sans-serif",padding:"clamp(12px,3vw,34px)",background:"#eaf6fa",minHeight:"100vh",color:"#145b83"}}>
  <div style={{maxWidth:1250,margin:"auto"}}>
  <Link href={"/admin/workshops/"+id}>العودة إلى الورشة</Link>
  <h1>شاشات النشاط التفاعلي KWLR — المدرسة الانطباعية</h1>
  <p>الجلسة {code} — يتحكم المدرب وحده في فتح الخطوات بالتسلسل.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,margin:"15px 0"}}>
   {[["عدد الاستجابات بالمرحلة",stage===4?unanswered.length:Number(counts[String(stage)]??0)],["إجمالي الأسئلة",questions.length],["جميع الاستجابات",total],["المشاركون المستجيبون",state?.unique_participants??0],["الوقت المتبقي",stage===0||stage===4?"—":remaining+" ثانية"]].map(([title,value])=><div key={String(title)} style={{background:"#fff",borderRadius:13,padding:15,boxShadow:"0 6px 22px #174e6817"}}><small>{title}</small><div style={{fontSize:27,fontWeight:800}}>{value}</div></div>)}
  </div>
  <nav style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}} aria-label="التحكم بالمراحل">
   {labels.slice(1).map((label,i)=>{const next=i+1;return <button key={next} disabled={busy||next!==stage+1||(stage>0&&!finished)} onClick={()=>void control(next)} style={{background:next===stage?"#0e708a":"#177f99",color:"#fff",border:0,borderRadius:10,padding:"12px 16px",font:"inherit",opacity:next===stage+1&&(stage===0||finished)?1:.5}}>{label} {durations[next]>0?"("+durations[next]/60+" دقائق)":""}</button>})}
  </nav>
  <section style={{background:"#fff",borderRadius:17,padding:23,minHeight:320}}>
   <h2>{labels[stage]} {stage===1?"— دون عرض النص":stage===2?"— دون عرض النص":""}</h2>
   {stage===0?<><p>اعرض الباركود للمتدربين وابدأ السؤال الأول عند جاهزيتهم.</p>{qr&&<img src={qr} alt="رمز دخول متدربي جلسة KWLR" width={200} height={200}/>}</>:null}
   {stage===1&&<p>اكتب كل ما تعرفه مسبقًا عن المدرسة الانطباعية. المدة دقيقتان. لن يظهر نص القراءة في هذه المرحلة.</p>}
   {stage===2&&<p>دوّن جميع الأسئلة التي تريد أن تعرف إجاباتها عن المدرسة الانطباعية. المدة دقيقتان؛ سؤال واحد في كل إرسال.</p>}
   {stage===3&&<p>اقرأ النص الكامل على جهازك، ثم أجب عن الأسئلة التي وضعتها في المرحلة الثانية. المدة ثلاث دقائق.</p>}
   {stage===4&&<p>الأسئلة الآتية لم يربط أصحابها بها إجابات. ناقشها وصنّفها إلى مهام تعلم لاحق أو أسئلة بحثية.</p>}
   {stage>=1&&stage<=3&&remaining>0?<p style={{background:"#eaf6ff",padding:15,borderRadius:12}}>الاستجابات تُستقبل الآن. <strong>ستعرض القائمة على الشاشة تلقائيًا عند انتهاء المؤقت.</strong></p>:null}
   {finished&&<p style={{background:"#e1f8ea",padding:13,borderRadius:10}}>انتهى الوقت. تظهر النتائج الآن؛ يمكن للمدرب فتح المرحلة التالية.</p>}
   {(finished||stage===4)&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
     {currentEntries.map((entry:any,i:number)=><div key={entry.id} style={{background:"#f2fafd",padding:13,borderRadius:11,border:"1px solid #d3e8ee"}}><b>{i+1}</b> — {entry.response_text}</div>)}
     {currentEntries.length===0&&<p>لم تُسجّل استجابات لهذه الشاشة.</p>}
    </div>}
   {stage===4&&<p style={{fontSize:13}}>«غير مجابة» هنا تعني عدم ارتباط السؤال بإجابة محفوظة في المنصة، ولا تعني حكمًا آليًا على صحة المعرفة.</p>}
  </section>
  <p style={{marginTop:12}}>الإجابات: {counts["1"]??0} معرفة سابقة • {counts["2"]??0} سؤال • {counts["3"]??0} إجابة • غير المرتبطة: {unanswered.length}</p>
  {notice&&<p role="alert" style={{color:"#bd3838"}}>{notice}</p>}
  </div>
 </main>;
}
