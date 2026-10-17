"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import QRCode from "qrcode";
import {createClient} from "@supabase/supabase-js";
import {cairoDeck} from "@/lib/workshop/cairoDeck";
import "./cairo.css";
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
export default function WorkshopPresentation(){
 const params=useParams<{code:string}>(),code=String(params.code||"").toUpperCase();
 const [session,setSession]=useState<any>(null),[page,setPage]=useState(0),[qr,setQr]=useState(""),[controls,setControls]=useState(false),[status,setStatus]=useState("");
 useEffect(()=>{if(!code)return;QRCode.toDataURL(location.origin+"/w/"+code,{margin:1,width:360}).then(setQr).catch(()=>{});
 let mounted=true;async function refresh(){try{const {data,error}=await supabase.functions.invoke("workshop-public",{body:{action:"session",code}});if(error||!data?.session)throw Error("not found");if(mounted){setSession(data.session);setStatus("")}}catch{if(mounted)setStatus("تعذر تحديث بيانات الجلسة")}}
 void refresh();const timer=setInterval(refresh,7000);return()=>{mounted=false;clearInterval(timer)}},[code]);
 useEffect(()=>{const handle=(e:KeyboardEvent)=>{if(e.key==="ArrowLeft")setPage(p=>Math.min(43,p+1));if(e.key==="ArrowRight")setPage(p=>Math.max(0,p-1));if(e.key.toLowerCase()==="f")void document.documentElement.requestFullscreen?.().catch(()=>{})};window.addEventListener("keydown",handle);return()=>window.removeEventListener("keydown",handle)},[]);
 const original=cairoDeck[page],over=session?.settings?.presenter_slides?.[String(page)]||{};
 const title=typeof over.title==="string"&&over.title.trim()?over.title:original[0],body=typeof over.body==="string"&&over.body.trim()?over.body:original[1];
 const kind=original[2],phase=kind==="style"?1:kind==="assessment"?2:kind==="planning"||kind==="table"||kind==="bloom"?3:0;
 const allowed=session?.settings?.trainer_controlled_phases===true?Number(session.settings.active_phase??0):3;
 return <main dir="rtl" className="cairoShell">
 <section className="cairoStage">
 <div className="cairoTopAngle"/><div className="cairoLimeAngle"/>
 <div className="cairoHead">ورشة الخطوة الأولى للتمايز بصفوف الموهوبين</div>
 <article className="cairoBody"><small>{page+1} / 44 • {session?.title??"قاعة التدريب"}</small><h1>{title}</h1><p>{body}</p>
 {kind==="formula"&&<div className="cairoFormula">{["المحتوى","+","العملية","+","المنتج","=","تجربة تعلم"].map((x,i)=><span key={i}>{x}</span>)}</div>}
 {kind==="bloom"&&<div className="cairoBloom">{["أتذكر","أفهم","أطبق","أحلل","أقيم","أبدع"].map((x,i)=><span key={i} style={{background:["#d7e800","#54c9d5","#3bb0df","#388acb","#2870ae","#194f7f"][i]}}>{x}</span>)}</div>}
 {kind==="table"&&<div className="cairoMatrix"><b>العملية</b><b>المحتوى</b><b>المنتج</b>{["أتذكر","أفهم","أطبق","أحلل","أقيم","أبدع"].map((x,i)=><div className="cairoMatrixRow" key={x}><span>{x}</span><span>{page===19?"فيثاغورس":page===18?"الكسور":"موضوع الوحدة"}</span><span>{["مثال","رسم","شرح","بحث","تبرير","تصميم"][i]}</span></div>)}</div>}
 {(kind==="style"||kind==="assessment")&&qr&&<div className="cairoEntry"><img src={qr} alt="رمز QR لجلسة الورشة"/><span>رابط المتدربين: /w/{code}</span></div>}
 {phase>allowed&&<div className="cairoAlert">التطبيق ينتظر إذن المدرب</div>}
 {status&&<div className="cairoAlert">{status}</div>}
 </article><footer className="cairoFoot"><span>المرجع: د. محمد بن عوض رواس ود. جوليا روبرتس • القاهرة 2021</span><b>{page+1}</b></footer>
 </section>
 <nav className="cairoBar"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>السابق</button><button disabled={page===43} onClick={()=>setPage(p=>p+1)}>التالي</button><button onClick={()=>void document.documentElement.requestFullscreen?.().catch(()=>{})}>ملء الشاشة</button><button onClick={()=>setControls(v=>!v)}>إدارة العرض</button></nav>
 {controls&&<aside className="cairoPanel"><h2>لوحة العرض</h2><p>المرحلة المتاحة: {allowed||"انتظار"}</p><a href={session?.id?"/admin/workshops/"+session.id+"/slides":"/trainer"} target="_blank">تحرير الشرائح</a><a href={session?.id?"/trainer/session/"+session.id:"/trainer"} target="_blank">التحكم في الجلسة</a><button onClick={()=>setControls(false)}>إغلاق</button></aside>}
 </main>
}
