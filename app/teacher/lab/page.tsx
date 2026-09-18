"use client";
import Link from "next/link";
import {ArrowLeft,BookOpenCheck,BrainCircuit,Boxes,GitCompareArrows,Grid3X3,Layers3,School,UsersRound} from "lucide-react";

const tools=[
 {id:"tiering",icon:Layers3,title:"باني التدرج",tag:"الجاهزية",desc:"ابنِ مسارات متصاعدة في التحدي لنفس الهدف، دون تحويل التمايز إلى زيادة كمية العمل.",action:"ابدأ بناء L1 / L2 / L3",ready:true},
 {id:"bloom",icon:BrainCircuit,title:"بلوم المعدل",tag:"عمق التفكير",desc:"حوّل الهدف إلى خبرات وأسئلة تختلف في مستوى العملية المعرفية مع بقاء التعلم المقصود واضحًا.",action:"افتح محرك بلوم",ready:true},
 {id:"venn",icon:GitCompareArrows,title:"أشكال فن",tag:"المحتوى والعملية",desc:"صمّم المقارنة بدرجات مختلفة من التعقيد بحسب ما يستطيع المتعلم معالجته.",action:"افتح مصمم فن",ready:true},
 {id:"xo",icon:Grid3X3,title:"إكس / أو",tag:"الاختيار المقصود",desc:"أنشئ لوحة خيارات هادفة للمهام والمنتجات، مرتبطة بالجاهزية والاهتمامات والقدرات.",action:"قريبًا",ready:false},
 {id:"classroom",icon:UsersRound,title:"إدارة الصف المتمايز",tag:"التنفيذ",desc:"حوّل التصميم إلى مجموعات وأدوار ووقت ومحطات قابلة للتنفيذ داخل الحصة.",action:"قريبًا",ready:false},
];
export default function DifferentiationLab(){
 return <main className="labPage">
  <header className="labTop"><Link href="/" className="labBack">العودة للحساب <ArrowLeft size={15}/></Link><div><b>التمايز</b><small>مختبر المعلم</small></div></header>
  <section className="labHero"><div><span>DIFFERENTIATION STUDIO</span><h1>مختبر التمايز</h1><p>حوّل قرار التمايز إلى أداة تعليمية قابلة للتطبيق، ثم احتفظ بها في حسابك وطورها مع أدلة تعلم طلابك.</p></div><div className="labFlow"><span>شخّص</span><i/><span>قرّر</span><i/><span>صمّم</span><i/><span>نفّذ</span><i/><span>تأمل</span></div></section>
  <section className="labQuestion"><School size={22}/><div><span>ابدأ من القرار، لا من الأداة</span><h2>ما الذي يحتاج إلى التمايز في هذا الدرس؟</h2><div><button>الجاهزية</button><button>عمق التفكير</button><button>المحتوى</button><button>العملية</button><button>المنتج</button><button>إدارة التنفيذ</button></div></div></section>
  <section className="labTools"><div className="labSectionHead"><div><span>أدوات البناء</span><h2>خمس أدوات تعمل كمنظومة واحدة</h2></div><Boxes size={25}/></div>
   <div className="labToolGrid">{tools.map((t,i)=>{const Icon=t.icon;return <article key={t.id} className={t.ready?"labTool ready":"labTool"}><div className="labToolNo">0{i+1}</div><div className="labToolIcon"><Icon/></div><span>{t.tag}</span><h3>{t.title}</h3><p>{t.desc}</p>{t.ready?<Link href={t.id==="tiering"?"/teacher/lab/tiering":t.id==="bloom"?"/teacher/lab/bloom":t.id==="venn"?"/teacher/lab/venn":"/teacher/lab"}>{t.action}<ArrowLeft size={15}/></Link>:<button disabled>{t.action}</button>}</article>})}</div>
  </section>
  <section className="labPortfolio"><BookOpenCheck/><div><span>من الورشة إلى الممارسة</span><h2>كل أداة تبنيها تصبح جزءًا من مكتبتك المهنية.</h2><p>يمكن لاحقًا نسخها لدرس آخر، تطبيقها مع الطلاب، تسجيل أثرها، ثم إضافتها إلى ملف إنجاز ممارسة التمايز.</p></div></section>
 </main>
}