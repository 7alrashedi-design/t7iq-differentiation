import {
  ArrowLeft, BrainCircuit, CheckCircle2, ChevronLeft, GraduationCap,
  LineChart, Sparkles, Target, UsersRound, BookOpenCheck, Layers3
} from "lucide-react";

const students = [
  { name: "المجموعة أ", count: 7, label: "تحتاج دعمًا تأسيسيًا", cls: "warn" },
  { name: "المجموعة ب", count: 15, label: "عند المستوى المستهدف", cls: "good" },
  { name: "المجموعة ج", count: 6, label: "جاهزة لتحدٍ أعلى", cls: "advanced" }
];

const steps = [
  ["التهيئة", "نشاط قصير يعيد تنشيط المفهوم السابق ويربطه بالهدف الجديد."],
  ["التعلم الأساسي", "شرح موجّه مع مثالين متدرجين والتحقق السريع من الفهم."],
  ["المسارات المتمايزة", "ثلاثة مسارات مبنية تلقائيًا من بيانات إتقان الفصل."],
  ["التقويم الختامي", "مهمة قصيرة تحدث ملف التعلم وتغذي تخطيط الدرس التالي."]
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">T7</div>
          <div>
            <strong>T7IQ</strong>
            <span>منصة التمايز الذكية</span>
          </div>
        </div>

        <nav>
          <a className="active"><BrainCircuit size={18}/> رحلة اليوم</a>
          <a><UsersRound size={18}/> الفصول والطلاب</a>
          <a><Target size={18}/> خريطة الإتقان</a>
          <a><BookOpenCheck size={18}/> تجارب التعلم</a>
          <a><LineChart size={18}/> التقدم والأثر</a>
          <a><GraduationCap size={18}/> مساري المهني</a>
        </nav>

        <div className="coachCard">
          <Sparkles size={18}/>
          <b>الخبير يعمل في الخلفية</b>
          <p>يحلل التقدم ويبني التوصيات دون إثقالك بالأسئلة.</p>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">الخميس • الأسبوع الرابع</span>
            <h1>صباح الخير، أ. أحمد</h1>
            <p>أعددنا لك درس اليوم بناءً على آخر تقدم لطلاب الفصل.</p>
          </div>
          <button className="ghost">أول 1 <ChevronLeft size={16}/></button>
        </header>

        <section className="hero">
          <div className="heroText">
            <span className="pill"><Sparkles size={15}/> اقتراح ذكي جاهز</span>
            <h2>الدرس القادم: المعادلات الخطية</h2>
            <p>
              راجع النظام آخر أداء لـ 28 طالبًا، وربط المهارات الحالية بمتطلباتها السابقة،
              ثم أعاد تشكيل تجربة التعلم لتناسب ثلاثة أنماط من الاحتياج داخل الحصة نفسها.
            </p>
            <div className="heroActions">
              <button className="primary">عرض تجربة التعلم <ArrowLeft size={17}/></button>
              <button className="secondary">مراجعة سريعة</button>
            </div>
          </div>
          <div className="scoreCard">
            <span>جاهزية الفصل للدرس</span>
            <strong>76%</strong>
            <div className="progress"><i style={{width:"76%"}}/></div>
            <small>تحسن +8 نقاط عن آخر قياس مرتبط بالمهارة.</small>
          </div>
        </section>

        <section className="grid3">
          {students.map((s) => (
            <article className="metric" key={s.name}>
              <div className={`dot ${s.cls}`}/>
              <div>
                <span>{s.name}</span>
                <strong>{s.count} طلاب</strong>
                <small>{s.label}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="twoCols">
          <article className="panel">
            <div className="panelHead">
              <div>
                <span className="eyebrow">الخطة المقترحة</span>
                <h3>تجربة التعلم في 4 محطات</h3>
              </div>
              <Layers3 size={22}/>
            </div>
            <div className="timeline">
              {steps.map((s, i) => (
                <div className="step" key={s[0]}>
                  <div className="num">{i+1}</div>
                  <div><b>{s[0]}</b><p>{s[1]}</p></div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel insight">
            <div className="panelHead">
              <div>
                <span className="eyebrow">ملاحظة الخبير</span>
                <h3>لماذا عُدّل درس اليوم؟</h3>
              </div>
              <BrainCircuit size={22}/>
            </div>

            <div className="insightBox">
              <CheckCircle2 size={18}/>
              <p>أغلب الفصل أتقن التمثيل الرمزي، لذلك خُفف وقت الشرح المباشر.</p>
            </div>
            <div className="insightBox">
              <CheckCircle2 size={18}/>
              <p>7 طلاب لديهم فجوة في مفهوم سابق؛ أضيفت لهم تهيئة علاجية قصيرة.</p>
            </div>
            <div className="insightBox">
              <CheckCircle2 size={18}/>
              <p>6 طلاب أظهروا إتقانًا مرتفعًا؛ وُجهوا إلى مهمة تتطلب استدلالًا أعمق.</p>
            </div>

            <button className="wide">اعتماد الخطة لدرس اليوم</button>
          </article>
        </section>

        <footer>
          <span>T7IQ — Digital Lab for Research & Development</span>
          <span>نسخة أولية • Learning Intelligence Engine</span>
        </footer>
      </section>
    </main>
  );
}
