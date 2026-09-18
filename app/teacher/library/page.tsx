"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,BookOpenCheck,Copy,FilePlus2,FolderOpen,Layers3,MoreHorizontal,School,Trash2} from "lucide-react";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";
type Project={id:string;title:string;subject:string|null;grade:string|null;lesson:string|null;learning_goal:string|null;status:string;selected_tools:string[];updated_at:string};
const statusLabel:Record<string,string>={draft:"مسودة",ready:"جاهز للتطبيق",applied:"تم التطبيق",archived:"مؤرشف"};
export default function TeacherLibrary(){
 const [rows,setRows]=useState<Project[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{const s=getSupabaseBrowserClient();const {data,error}=await s.from("teacher_differentiation_projects").select("id,title,subject,grade,lesson,learning_goal,status,selected_tools,updated_at").order("updated_at",{ascending:false});if(error)throw error;setRows((data||[]) as Project[])}catch(e:any){setError(e?.message||"تعذر تحميل المكتبة")}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 async function remove(id:string){if(!confirm("حذف هذا المشروع من المكتبة؟"))return;const s=getSupabaseBrowserClient();await s.from("teacher_differentiation_projects").delete().eq("id",id);setRows(x=>x.filter(r=>r.id!==id))}
 async function duplicate(p:Project){const s=getSupabaseBrowserClient();const {data:{user}}=await s.auth.getUser();if(!user)return;await s.from("teacher_differentiation_projects").insert({teacher_id:user.id,title:p.title+" — نسخة",subject:p.subject,grade:p.grade,lesson:p.lesson,learning_goal:p.learning_goal,status:"draft",selected_tools:p.selected_tools});load()}
 return <main className="teacherLibrary">
  <header className="tierTop"><Link href="/">حساب المعلم <ArrowLeft size={14}/></Link><div><FolderOpen/><b>مكتبتي</b></div><span>{rows.length} مشروع</span></header>
  <section className="libraryHero"><div><span>TEACHER PRACTICE LIBRARY</span><h1>مكتبة التمايز</h1><p>كل درس أو أداة تبنيها تتحول إلى أصل مهني قابل للعودة والتطوير والتطبيق مرة أخرى.</p></div><Link href="/teacher/lab/lesson"><FilePlus2/> مشروع تمايز جديد</Link></section>
  <section className="libraryStats"><div><b>{rows.length}</b><span>إجمالي المشاريع</span></div><div><b>{rows.filter(x=>x.status==="ready").length}</b><span>جاهزة للتطبيق</span></div><div><b>{rows.filter(x=>x.status==="applied").length}</b><span>تم تطبيقها</span></div><div><b>{rows.filter(x=>x.status==="draft").length}</b><span>مسودات</span></div></section>
  <section className="libraryContent"><div className="libraryHead"><div><span>أعمالي</span><h2>مشروعات التمايز</h2></div><Link href="/teacher/lab">فتح مختبر التمايز</Link></div>
  {loading&&<div className="libraryEmpty">جارٍ تحميل مكتبتك…</div>}
  {!loading&&error&&<div className="libraryEmpty">{error}</div>}
  {!loading&&!error&&!rows.length&&<div className="libraryEmpty"><BookOpenCheck/><h3>مكتبتك جاهزة لأول مشروع</h3><p>ابدأ بمعالج الدرس؛ سيقودك من الحاجة التعليمية إلى الأداة المناسبة ثم يحفظ التصميم هنا.</p><Link href="/teacher/lab/lesson">ابدأ أول مشروع</Link></div>}
  <div className="projectGrid">{rows.map(p=><article key={p.id}><header><div className={"projectStatus "+p.status}>{statusLabel[p.status]||p.status}</div><button><MoreHorizontal/></button></header><div className="projectIcon"><School/></div><span>{[p.subject,p.grade].filter(Boolean).join(" • ")||"درس متمايز"}</span><h3>{p.title}</h3><p>{p.learning_goal||"لم يضف ناتج التعلم بعد."}</p><div className="toolTags">{(p.selected_tools||[]).slice(0,4).map(t=><i key={t}>{toolName(t)}</i>)}</div><footer><small>آخر تحديث {new Date(p.updated_at).toLocaleDateString("ar-SA")}</small><div><button onClick={()=>duplicate(p)} title="نسخ"><Copy/></button><button onClick={()=>remove(p.id)} title="حذف"><Trash2/></button></div></footer></article>)}</div>
  </section>
 </main>
}
function toolName(t:string){return ({readiness:"التدرج",thinking:"بلوم",concepts:"فن",choice:"إكس/أو",operations:"إدارة الصف"} as Record<string,string>)[t]||t}
