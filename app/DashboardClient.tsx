"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, Bell, BookOpenCheck, BrainCircuit, CheckCircle2,
  ChevronDown, CircleUserRound, GraduationCap, House, LineChart, Menu,
  HelpCircle, Sparkles, Target, UsersRound
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ClassRow = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  stage: string;
};

const groups = [
  { title: "دعم موجّه", count: 7, note: "مهارة سابقة تحتاج تعزيزًا", tone: "peach" },
  { title: "المسار الأساسي", count: 15, note: "جاهزون لهدف التعلم", tone: "mint" },
  { title: "تحدٍ ممتد", count: 6, note: "جاهزون لمستوى أعمق", tone: "violet" }
];

const stations = [
  { no: "01", title: "تهيئة ذكية", text: "نشاط قصير يستعيد المتطلب السابق دون إعادة شرح الدرس كله." },
  { no: "02", title: "بناء الفهم", text: "شرح مركز ومثال متدرج مع تحقق سريع من الاستيعاب." },
  { no: "03", title: "مسارات متمايزة", text: "مهمات مختلفة في العمق والدعم داخل الهدف نفسه." },
  { no: "04", title: "تحديث التقدم", text: "تقويم خفيف يحدث ملف الطالب ويغذي تخطيط الحصة القادمة." }
];

export default function DashboardClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [teacherName, setTeacherName] = useState("أ. أحمد");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!alive) return;
        setConnected(Boolean(user));

        if (user) {
          const [{ data: profile }, { data: classRows }] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
            supabase.from("classes").select("id,name,subject,grade,stage").order("created_at", { ascending: false }).limit(5)
          ]);

          if (!alive) return;
          if (profile?.full_name) setTeacherName(profile.full_name);
          if (classRows) setClasses(classRows as ClassRow[]);
        }
      } catch {
        // الواجهة تستمر كعرض تجريبي حتى تكتمل بيانات الحساب.
      }
    };
    run();
    return () => { alive = false; };
  }, []);

  const activeClass = useMemo(() => classes[0], [classes]);

  return (
    <main className="appShell">
      <aside className={`sideRail ${menuOpen ? "open" : ""}`}>
        <div className="brandBlock">
          <div className="differenceMark small"><span>ت</span></div>
          <div>
            <strong>T7IQ</strong>
            <span>منصة التمايز الذكية</span>
          </div>
          <button className="closeMenu" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة">×</button>
        </div>

        <nav className="mainNav">
          <a className="active"><House size={18}/> رحلة اليوم</a>
          <a><UsersRound size={18}/> فصولي وطلابي</a>
          <Link href="/teacher/readiness"><Target size={18}/> خريطة الإتقان</Link>
          <Link href="/teacher/lab"><BookOpenCheck size={18}/> مختبر التمايز</Link>
          <Link href="/teacher/library"><GraduationCap size={18}/> مكتبتي</Link>
          <Link href="/teacher/impact"><LineChart size={18}/> التقدم والأثر</Link>
          <Link href="/teacher/growth"><GraduationCap size={18}/> مساري المهني</Link><Link href="/help"><HelpCircle size={18}/> دليل الاستخدام</Link>
        </nav>

        <div className="expertNote">
          <Sparkles size={17}/>
          <div>
            <b>الخبير يجهز الخطوة التالية</b>
            <p>تحليل مستمر للتقدم، وتوصيات مختصرة قابلة للتنفيذ.</p>
          </div>
        </div>

        <div className="accountMini">
          <CircleUserRound size={20}/>
          <div>
            <b>{teacherName}</b>
            <span>{connected ? "الحساب متصل بالبيانات" : "وضع العرض التجريبي"}</span>
          </div>
        </div>
      </aside>

      <section className="mainArea">
        <header className="mobileHeader">
          <button className="iconButton" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><Menu size={21}/></button>
          <div className="mobileBrand"><span>التمايز</span><small>مساعد التعلم الذكي</small></div>
          <button className="iconButton" aria-label="التنبيهات"><Bell size={19}/></button>
        </header>

        <header className="desktopTopbar">
          <div>
            <span className="sectionKicker">رحلة التعلم اليوم</span>
            <h1>أهلاً {teacherName}</h1>
            <p>جهزنا لك تجربة تعلم مبنية على أحدث تقدم لطلابك، لتراجعها وتبدأ الحصة بثقة.</p>
          </div>
          <div className="topActions">
            <button className="softButton">
              {activeClass ? activeClass.name : "أول 1"}
              <ChevronDown size={16}/>
            </button>
            <button className="iconButton"><Bell size={18}/></button>
          </div>
        </header>

        <section className="lessonHero">
          <div className="lessonCopy">
            <span className="smartBadge"><Sparkles size={15}/> مقترح جاهز للمراجعة</span>
            <p className="lessonEyebrow">رياضيات • الحصة الثالثة</p>
            <h2>المعادلات الخطية</h2>
            <p className="lessonSummary">
              تم تخفيف الشرح المباشر، وإضافة دعم تأسيسي لمجموعة صغيرة، وتحدٍ أعلى للطلاب الذين أظهروا إتقانًا مبكرًا.
            </p>

            <div className="heroButtons">
              <button className="primaryButton">عرض تجربة التعلم <ArrowLeft size={17}/></button>
              <button className="outlineButton">مراجعة سريعة</button>
            </div>
          </div>

          <div className="readinessCard">
            <div className="ring" style={{"--value":"76%"} as React.CSSProperties}>
              <div><strong>76%</strong><span>جاهزية الفصل</span></div>
            </div>
            <p><b>+8</b> نقاط تحسن عن آخر قياس مرتبط بالمهارة.</p>
          </div>
        </section>

        <section className="groupGrid">
          {groups.map((g) => (
            <article className={`groupCard ${g.tone}`} key={g.title}>
              <div className="groupTop">
                <span>{g.title}</span>
                <strong>{g.count}</strong>
              </div>
              <p>{g.note}</p>
              <button>عرض الطلاب <ArrowLeft size={15}/></button>
            </article>
          ))}
        </section>

        <section className="contentGrid">
          <article className="surface lessonPlan">
            <div className="surfaceHead">
              <div>
                <span className="sectionKicker">الخطة المقترحة</span>
                <h3>تجربة تعلم في 4 محطات</h3>
              </div>
              <div className="iconBadge blue"><BookOpenCheck size={20}/></div>
            </div>

            <div className="stationList">
              {stations.map((s) => (
                <div className="station" key={s.no}>
                  <span className="stationNo">{s.no}</span>
                  <div>
                    <b>{s.title}</b>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="surface expertPanel">
            <div className="surfaceHead">
              <div>
                <span className="sectionKicker">قرار الخبير</span>
                <h3>لماذا تغيرت الخطة؟</h3>
              </div>
              <div className="iconBadge mint"><BrainCircuit size={20}/></div>
            </div>

            <div className="expertPoints">
              <div><CheckCircle2 size={18}/><p>أغلب الفصل أتقن التمثيل الرمزي؛ لا حاجة لإطالة التهيئة.</p></div>
              <div><CheckCircle2 size={18}/><p>الفجوة الأبرز لدى 7 طلاب مرتبطة بمتطلب سابق وليست بالدرس الحالي.</p></div>
              <div><CheckCircle2 size={18}/><p>6 طلاب جاهزون لمهمة تستهدف تفسير الحل وتبريره، لا زيادة عدد الأسئلة.</p></div>
            </div>

            <div className="nextMove">
              <BarChart3 size={19}/>
              <div>
                <span>الخطوة التالية</span>
                <b>اعتماد الخطة وتنفيذ تقويم ختامي من 4 دقائق</b>
              </div>
            </div>

            <button className="approveButton">اعتماد خطة اليوم</button>
          </article>
        </section>

        <section className="surface progressStrip">
          <div>
            <span className="sectionKicker">تقدم هذا الأسبوع</span>
            <h3>التعلم يتحرك في الاتجاه الصحيح</h3>
          </div>
          <div className="progressItems">
            <div><strong>82%</strong><span>إتقان المهارات المستهدفة</span></div>
            <div><strong>11</strong><span>طالبًا انتقلوا لمستوى أعلى</span></div>
            <div><strong>3</strong><span>فجوات جرى علاجها مبكرًا</span></div>
          </div>
        </section>

        <footer className="appFooter">
          <span>التمايز • من T7IQ Digital Lab</span>
          <Link href="/login">دخول المعلمين</Link>
        </footer>
      </section>

      <nav className="mobileBottomNav">
        <a className="active"><House size={20}/><span>اليوم</span></a>
        <a><UsersRound size={20}/><span>الفصول</span></a>
        <a><Target size={20}/><span>الإتقان</span></a>
        <a><BookOpenCheck size={20}/><span>الدروس</span></a>
      </nav>
    </main>
  );
}
