"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpenCheck, BrainCircuit, CheckCircle2, GraduationCap,
  Layers3, Sparkles, Target, UsersRound
} from "lucide-react";
import DashboardClient from "./DashboardClient";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function HomeGate() {
  const [state, setState] = useState<"loading"|"guest"|"user">("loading");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setState(data.session?.user ? "user" : "guest");
      } catch {
        if (alive) setState("guest");
      }
    };
    run();
    return () => { alive = false; };
  }, []);

  if (state === "loading") {
    return (
      <main className="homeLoading">
        <div className="differenceMark"><span>ت</span></div>
        <b>التمايز</b>
        <span>جارٍ تجهيز تجربتك…</span>
      </main>
    );
  }

  if (state === "user") return <DashboardClient />;

  return (
    <main className="publicHome">
      <header className="publicNav">
        <div className="platformBrand">
          <div className="differenceMark small"><span>ت</span></div>
          <div>
            <b>التمايز</b>
            <small>منصة تعلم ذكية للمعلم</small>
          </div>
        </div>

        <Link href="/login" className="navLogin">دخول المنصة <ArrowLeft size={16}/></Link>
      </header>

      <section className="publicHero">
        <div className="publicHeroCopy">
          <span className="smartBadge"><Sparkles size={15}/> من التدريب إلى الممارسة</span>
          <h1>كل طالب يتعلم بطريقته.<br/><em>والمعلم لا يبدأ من الصفر.</em></h1>
          <p>
            «التمايز» ترافق المعلم بعد الورشة التدريبية طوال العام، وتحوّل بيانات التشخيص
            والتقدم إلى تجربة تعلم جاهزة، متدرجة، وأكثر ملاءمة لطلابه.
          </p>
          <div className="publicHeroActions">
            <Link href="/login" className="primaryButton heroLogin">دخول المعلمين <ArrowLeft size={17}/></Link>
            <a href="#journey" className="outlineButton heroOutline">كيف تعمل المنصة؟</a>
          </div>

          <div className="heroTrust">
            <span><CheckCircle2 size={15}/> أقل مدخلات</span>
            <span><CheckCircle2 size={15}/> تخطيط أذكى</span>
            <span><CheckCircle2 size={15}/> متابعة مستمرة</span>
          </div>
        </div>

        <div className="publicVisual">
          <div className="visualGlow"/>
          <div className="lessonPreview">
            <div className="previewHead">
              <div>
                <span>درس اليوم</span>
                <b>المعادلات الخطية</b>
              </div>
              <div className="previewScore">76%</div>
            </div>
            <div className="previewGroups">
              <div><span>دعم موجّه</span><b>7</b></div>
              <div><span>المسار الأساسي</span><b>15</b></div>
              <div><span>تحدٍ ممتد</span><b>6</b></div>
            </div>
            <div className="previewDecision">
              <BrainCircuit size={18}/>
              <div>
                <span>اقتراح الخبير</span>
                <b>قلّل الشرح المباشر، وامنح 6 طلاب تحديًا أعمق.</b>
              </div>
            </div>
            <div className="previewSteps">
              <span>تهيئة ذكية</span><i/>
              <span>بناء الفهم</span><i/>
              <span>مسارات متمايزة</span>
            </div>
          </div>
        </div>
      </section>

      <section id="journey" className="publicJourneySection">
        <div className="sectionIntro">
          <span className="sectionKicker">رحلة واحدة مترابطة</span>
          <h2>الورشة هي البداية، والمنصة تكمل العمل.</h2>
          <p>لا نضيف أداة أخرى إلى عبء المعلم؛ بل نحول ما تعلمه في الورشة إلى ممارسة يومية أسهل.</p>
        </div>

        <div className="journeyCards">
          <article>
            <div className="journeyIcon"><GraduationCap size={22}/></div>
            <span>01</span>
            <h3>يتدرب</h3>
            <p>برنامج تدريبي عملي يبني فهم التمايز وطريقة استخدام المنصة.</p>
          </article>
          <article>
            <div className="journeyIcon"><Target size={22}/></div>
            <span>02</span>
            <h3>يشخّص</h3>
            <p>نتائج الطلاب تتحول إلى خريطة إتقان وفجوات قابلة للعمل.</p>
          </article>
          <article>
            <div className="journeyIcon"><Layers3 size={22}/></div>
            <span>03</span>
            <h3>يعلّم</h3>
            <p>المنصة تقترح تجربة تعلم متمايزة جاهزة للمراجعة والتنفيذ.</p>
          </article>
          <article>
            <div className="journeyIcon"><BookOpenCheck size={22}/></div>
            <span>04</span>
            <h3>يتقدم</h3>
            <p>كل دليل تعلم يحدث ملف الطالب ويجعل الدرس التالي أكثر دقة.</p>
          </article>
        </div>
      </section>

      <section className="publicRoles">
        <div>
          <span className="sectionKicker">مرنة في التشغيل</span>
          <h2>مدرسة كاملة أو معلم مستقل.</h2>
          <p>يمكن لمدير المنصة إنشاء مدرسة بمعلميها وفصولها، أو إنشاء حساب مستقل لمعلم واحد.</p>
        </div>
        <div className="roleChips">
          <span><UsersRound size={16}/> مدير منصة</span>
          <span><UsersRound size={16}/> مدير مدرسة</span>
          <span><UsersRound size={16}/> معلم</span>
          <span><UsersRound size={16}/> مدرب / مشرف</span>
        </div>
      </section>

      <footer className="publicFooter">
        <div className="platformBrand compact">
          <div className="differenceMark small"><span>ت</span></div>
          <div><b>التمايز</b><small>من T7IQ Digital Lab</small></div>
        </div>
        <span>تعلم يتقدم مع كل طالب.</span>
      </footer>
    </main>
  );
}
