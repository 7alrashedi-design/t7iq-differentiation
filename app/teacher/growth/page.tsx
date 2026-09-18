"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,BookOpenCheck,BrainCircuit,CheckCircle2,GitCompareArrows,Grid3X3,Layers3,RefreshCw,School,Sparkles,TrendingUp} from "lucide-react";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";
const tools=[
 ["readiness","التدرج",Layers3],["thinking","بلوم المعدل",BrainCircuit],["concepts","أشكال فن",GitCompareArrows],["choice","إكس / أو",Grid3X3],["operations","إدارة الصف",School]
] as const;
export default function TeacherGrowth(){
 const [projects,setProjects]=useState<any[]>([]),[reflections,setReflections]=useState<any[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{const s=getSupabaseBrowserClient();const [{data:p},{data:r}]=await Promise.all([s.from("teacher_differentiation_projects").select("*").order("updated_at",{ascending:false}),s.from("teacher_project_reflections").select("*").order("created_at",{ascending:false})]);setProjects(p||[]);setReflections(r||[]);setLoading(false)})()},[]);
 const applied=projects.filter(p=>p.status==="applied").length;
 const used=useMemo(()=>tools.map(([key,label,Icon])=>({key,label,Icon,count:projects.filter(p=>p.project_data?.[key]).length})),[projects]);
 const max=Math.max(1,...used.map(x=>x.count)); const breadth=used.filter(x=>x.count>0).length;
 const recent=reflections.slice(0,5);
 return <main className="growthPage">
  <header className="tierTop"><Link href="/">حساب المعلم <ArrowLeft size={14}/></Link><div><TrendingUp/><b>تطوري المهني</b></div><span>ممارسة • دليل • تحسين</span></header>
  <section className="growthHero"><div><span>PROFESSIONAL PRACTICE</span><h1>أثر الممارسة، لا عدّ الأنشطة.</h1><p>هذه اللوحة تقرأ ما بنيته وطبقته وراجعته لتساعدك في الكوتشينق والتأمل المهني. المؤشرات وصفية وليست درجة تقييم للمعلم.</p></div><Link href="/teacher/lab/lesson"><Sparkles/> ابدأ دورة تعلم جديدة</Link></section>
  {loading?<div className="libraryEmpty">جارٍ قراءة سجل الممارسة…</div>:<>
  <section className="growthKpis"><article><BookOpenCheck/><div><b>{projects.length}</b><span>مشروع تعلم صممته</span></div></article><article><CheckCircle2/><div><b>{applied}</b><span>مشروعات وصلت للتطبيق</span></div></article><article><RefreshCw/><div><b>{reflections.length}</b><span>دورات تأمل وتحسين</span></div></article><article><BrainCircuit/><div><b>{breadth}/5</b><span>تنوع أدوات التمايز</span></div></article></section>
  <section className="growthGrid"><div className="growthPanel"><header><span>بصمة الممارسة</span><h2>كيف أصمم التمايز؟</h2><p>التكرار هنا يكشف نمط الاستخدام، لا جودة المعلم.</p></header><div className="toolUsage">{used.map(x=>{const Icon=x.Icon;return <div key={x.key}><Icon/><b>{x.label}</b><i><span style={{width:(x.count/max*100)+"%"}}/></i><strong>{x.count}</strong></div>})}</div><div className="growthInsight">{breadth===0?"ابدأ بأول مشروع لتظهر بصمة ممارستك.":breadth<3?"تتركز ممارستك حاليًا في عدد محدود من الأدوات. جرّب أداة جديدة عندما يبرر دليل الطلاب ذلك.":"لديك تنوع جيد في أدوات التصميم. حافظ على اختيار الأداة بناءً على الحاجة لا لمجرد التنويع."}</div></div>
  <div className="growthPanel"><header><span>دورة التحسين</span><h2>من التصميم إلى التعلم المهني</h2><p>القيمة الأعلى عندما يعود دليل التطبيق إلى قرار جديد.</p></header><div className="cycleNumbers"><div><b>{projects.length}</b><span>صممت</span></div><i>←</i><div><b>{applied}</b><span>طبقت</span></div><i>←</i><div><b>{reflections.length}</b><span>راجعت</span></div></div><div className="growthInsight">{projects.length&&!applied?"لديك تصميمات لم تصل بعد إلى توثيق التطبيق. اختر درسًا وابدأ بجمع دليل بسيط بعد الحصة.":applied&&!reflections.length?"بدأ التطبيق؛ الخطوة المهنية التالية هي تسجيل الدليل والقرار الذي سيغير النسخة القادمة.":"كل تأمل محفوظ يبني سجلًا يمكن مناقشته في جلسة كوتشينق."}</div></div></section>
  <section className="practiceTimeline"><header><div><span>آخر التأملات</span><h2>قرارات خرجت من الحصة</h2></div><Link href="/teacher/library">عرض مكتبتي</Link></header>{!recent.length?<div className="libraryEmpty">لم تُسجل تأملات بعد.</div>:recent.map((r,i)=>{const p=projects.find(x=>x.id===r.project_id);return <article key={r.id}><div className="timelineDot">{reflections.length-i}</div><div className="timelineBody"><header><b>{p?.title||"درس متمايز"}</b><small>{new Date(r.created_at).toLocaleDateString("ar-SA")}</small></header><p><span>الدليل</span>{r.evidence}</p><p className="nextDecision"><span>القرار التالي</span>{r.next_decision}</p>{p&&<Link href={"/teacher/plan/"+p.id}>فتح سجل الدرس <ArrowLeft/></Link>}</div></article>})}</section>
  </>}</main>
}