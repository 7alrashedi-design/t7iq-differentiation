"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";
import {impressionismReading} from "@/lib/workshop/impressionismReading";
const titles=["بانتظار تفعيل المدرب","ماذا تعرف عن المدرسة الانطباعية؟","ماذا تريد أن تعرف عن المدرسة الانطباعية؟","ماذا تعلمت؟","متابعة الأسئلة غير المجابة"];
const descriptions=["سيبدأ النشاط عند إذن المدرب.","اكتب جميع معارفك السابقة عن الموضوع خلال دقيقتين، دون قراءة النص.","دوّن جميع الأسئلة التي تريد معرفة إجاباتها عن المدرسة الانطباعية خلال دقيقتين.","اقرأ النص كاملًا، ثم أجب عن الأسئلة التي كتبتها خلال ثلاث دقائق.","راجع الأسئلة التي لم تُربط بإجابات، وحدد ما يحتاج إلى تعلم أو بحث لاحق."];
export default function KWLRParticipant(){
 const {code:rawCode}=useParams<{code:string}>();
 const code=String(rawCode).toUpperCase();
 const db=useMemo(()=>getSupabaseBrowserClient(),[]);
 const [state,setState]=useState<any>(null),[answer,setAnswer]=useState(""),[error,setError]=useState(""),[questionId,setQuestionId]=useState(""),[now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false);
 const [token,setToken]=useState("");
 useEffect(()=>{setToken(localStorage.getItem("tamayoz-workshop-"+code)||"")},[code]);
 async function refresh(){
  const {data,error}=await db.functions.invoke("workshop-public",{body:{action:"kwlr_state",code,participant_token:token}});
  if(!error&&data&&!data.error)setState((old:any)=>{if(old?.run?.stage!==data.run.stage){setAnswer("");setQuestionId("");setError("")}return data});
 }
 useEffect(()=>{void refresh();const t=setInterval(()=>{void refresh();setNow(Date.now())},2000);return()=>clearInterval(t)},[code,token]);
 const stage=Number(state?.run?.stage??0);
 const remaining=state?.run?.stage_ends_at?Math.max(0,Math.ceil((new Date(state.run.stage_ends_at).getTime()-now)/1000)):0;
 const mine=state?.mine??[];
 const questions=mine.filter((x:any)=>x.stage===2);
 const linked=new Set(mine.filter((x:any)=>x.stage===3&&x.related_question_id).map((x:any)=>x.related_question_id));
 const unanswered=questions.filter((x:any)=>!linked.has(x.id));
 async function submit(){
  if(busy||!answer.trim()||remaining<=0||(stage===3&&questions.length>0&&!questionId))return;
  setBusy(true);setError("");
  const {data,error}=await db.functions.invoke("workshop-public",{body:{action:"kwlr_submit",code,participant_token:token,response_text:answer.trim(),related_question_id:stage===3?questionId||null:null}});
  setBusy(false);
  if(error||data?.error){setError(data?.error||"تعذر إرسال الاستجابة");return}
  setAnswer("");setQuestionId("");void refresh();
 }
 const totals=state?.counts??{},responses=Object.values(totals).reduce((s:number,v:any)=>s+Number(v||0),0);
 return <main dir="rtl" style={{fontFamily:"El Messiri,Tahoma,sans-serif",background:"linear-gradient(135deg,#e7f7fb,#f7fbfd)",minHeight:"100vh",padding:"min(5vw,38px)",color:"#145b83"}}>
  <div style={{maxWidth:1000,margin:"auto"}}>
   <h1>نشاط KWLR — المدرسة الانطباعية</h1>
   <p>الجلسة: <strong>{code}</strong> • المرحلة {stage} من 4</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
    {[["استجابات هذه المرحلة",totals[String(stage)]??0],["مجموع الأسئلة",state?.kwlr_progress?.questions??0],["كل الاستجابات",responses],["الوقت المتبقي",stage<=3&&stage>=1?remaining+" ث":"—"]].map(([label,value])=><div key={String(label)} style={{background:"#fff",borderRadius:12,padding:13,boxShadow:"0 3px 12px #0b56701a"}}><small>{label}</small><div style={{fontSize:25,fontWeight:700}}>{value}</div></div>)}
   </div>
   {!token&&<p role="alert">انضم أولًا إلى الجلسة من <a href={"/w/"+code}>صفحة الورشة</a> على هذا الجهاز.</p>}
   <section style={{background:"#fff",borderRadius:18,padding:"clamp(16px,3vw,32px)",boxShadow:"0 7px 32px #0c4e6b12"}}>
    <h2>{titles[stage]}</h2><p>{descriptions[stage]}</p>
    {stage>=1&&stage<=3&&remaining===0&&<p role="status" style={{background:"#fff2c5",padding:12,borderRadius:9}}>انتهى وقت هذه المرحلة، وتُعرض النتائج الآن على شاشة المدرب. انتظر تفعيل المرحلة التالية.</p>}
    {stage===3&&<article aria-label="النص القرائي الكامل للمدرسة الانطباعية" style={{background:"#f4f9fd",border:"1px solid #c3e2ee",padding:18,maxHeight:340,overflowY:"auto",lineHeight:2,fontSize:16,borderRadius:12,marginBottom:14}}>{impressionismReading.map((para,i)=>i===0||i===7?<h3 key={i}>{para}</h3>:<p key={i}>{para}</p>)}</article>}
    {stage===3&&<label style={{display:"block",marginBottom:12}}>السؤال الذي تريد الإجابة عنه
      <select value={questionId} onChange={e=>setQuestionId(e.target.value)} style={{display:"block",width:"100%",padding:12,marginTop:6,font:"inherit",borderRadius:8}}>
       <option value="">{questions.length?"اختر السؤال الذي تجيب عنه":"معلومة تعلمتها دون سؤال سابق"}</option>
       {questions.map((q:any)=><option key={q.id} value={q.id}>{q.response_text}</option>)}
      </select>
     </label>}
    {stage>=1&&stage<=3&&<><textarea aria-label={stage===1?"معلوماتي السابقة":stage===2?"سؤال أريد معرفته":"إجابتي أو ما تعلمته"} value={answer} onChange={e=>setAnswer(e.target.value)} disabled={!token||remaining===0||busy} rows={4} maxLength={2000} placeholder={stage===1?"اكتب معلومة واحدة في كل إرسال، ثم أضف المزيد":stage===2?"اكتب سؤالًا واحدًا في كل إرسال، ويمكنك إضافة أسئلة أخرى":"اكتب الإجابة المستندة إلى النص ثم أرسل، ويمكنك الإجابة عن سؤال آخر"} style={{display:"block",width:"100%",padding:13,boxSizing:"border-box",border:"1px solid #b4d8e8",borderRadius:11,font:"inherit"}}/>
      <button type="button" disabled={!token||!answer.trim()||remaining===0||busy||(stage===3&&questions.length>0&&!questionId)} onClick={()=>void submit()} style={{padding:"12px 21px",marginTop:13,background:"#137f96",color:"#fff",border:0,borderRadius:10,font:"inherit"}}>{busy?"جارٍ الإرسال":"إضافة استجابة"}</button>
      <p>استجاباتك في هذه المرحلة: {mine.filter((x:any)=>x.stage===stage).length} — يمكنك إضافة أكثر من استجابة قبل انتهاء المؤقت.</p>
     </>}
    {stage>=1&&stage<=3&&<div><h3>استجاباتك المحفوظة</h3>{mine.filter((x:any)=>x.stage===stage).map((x:any,i:number)=><p key={x.id} style={{padding:10,background:"#f5fafe",borderRadius:8}}>{i+1}. {x.response_text}</p>)}</div>}
    {stage===0&&<p>لا يظهر النص القرائي قبل فتح «ماذا تعلمت؟» من المدرب.</p>}
    {stage===4&&<><h3>أسئلتك التي لم تُربط بإجابات: {unanswered.length}</h3>{unanswered.map((x:any)=><p key={x.id} style={{padding:12,background:"#fff2dd",borderRadius:8}}>{x.response_text}</p>)}<p>هذه أسئلة لم تُربط بإجابة من استجاباتك، ولا يعني ذلك أنها غير مجابة علميًا.</p></>}
    {error&&<p role="alert" style={{color:"#b33434"}}>{error}</p>}
   </section>
  </div>
 </main>;
}
