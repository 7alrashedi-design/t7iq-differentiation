"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";
export default function SlideEditor(){
 const {id}=useParams<{id:string}>();
 const [session,setSession]=useState<any>(null),[index,setIndex]=useState(0),[title,setTitle]=useState(""),[body,setBody]=useState(""),[msg,setMsg]=useState("");
 useEffect(()=>{const db=getSupabaseBrowserClient();void db.from("workshop_sessions").select("id,title,session_code,settings").eq("id",id).maybeSingle().then(({data,error})=>{if(error||!data){setMsg("تعذر الوصول إلى الجلسة. تحقق من صلاحيات الإدارة.");return}setSession(data)})},[id]);
 useEffect(()=>{if(!session)return;const row=session.settings?.presenter_slides?.[String(index)]||{};setTitle(row.title||"");setBody(row.body||"")},[session,index]);
 async function save(){if(!session)return;const db=getSupabaseBrowserClient();const old=session.settings||{};const slides={...(old.presenter_slides||{}),[String(index)]:{title,body}};const settings={...old,presenter_slides:slides};
 const {data,error}=await db.from("workshop_sessions").update({settings}).eq("id",id).select("id").maybeSingle();
 if(error||!data){setMsg("لم يُحفظ التعديل: تحقق من الصلاحيات.");return}
 setSession({...session,settings});setMsg("تم حفظ الشريحة "+(index+1));
 }
 return <main dir="rtl" style={{maxWidth:840,margin:"auto",padding:24,fontFamily:"El Messiri,Arial",lineHeight:1.8}}>
 <Link href={"/admin/workshops/"+id}>العودة لإدارة الورشة</Link><h1>محرر عرض الورشة</h1>
 <p>الشرائح 1–38 وفق ملف الجزء العملي المرفق (أكتوبر 2026)؛ التعديلات خاصة بهذه الجلسة. لا تُغير المقياس أو نتائجه.</p>
 <label>رقم الشريحة <select value={index} onChange={e=>setIndex(Number(e.target.value))}>{Array.from({length:38},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label>
 <label style={{display:"block"}}>العنوان<input style={{display:"block",width:"100%",padding:12}} value={title} onChange={e=>setTitle(e.target.value)}/></label>
 <label style={{display:"block"}}>المتن<textarea rows={6} style={{display:"block",width:"100%",padding:12}} value={body} onChange={e=>setBody(e.target.value)}/></label>
 <button onClick={()=>void save()} disabled={!session}>حفظ التعديل</button><p role="status">{msg}</p>
 {session&&<a target="_blank" href={"/present/"+session.session_code}>فتح العرض</a>}
 </main>
}