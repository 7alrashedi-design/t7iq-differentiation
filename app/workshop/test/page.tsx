import Link from "next/link";
import { BarChart3, ExternalLink, FlaskConical, QrCode, Sparkles } from "lucide-react";

export default function WorkshopTestHub(){
  return <main className="participantGate testHubGate">
    <section className="testHubCard">
      <div className="platformBrand"><div className="differenceMark"><span>ت</span></div><div><b>التمايز</b><small>مختبر اختبار الورشة</small></div></div>
      <span className="smartBadge"><Sparkles size={15}/> النسخة التجريبية الشاملة</span>
      <h1>اختبر الورشة من طرفيها.</h1>
      <p>افتح تجربة المشارك على الجوال أو نافذة مستقلة، واترك لوحة المجموعة الحية مفتوحة على جهاز المدرب.</p>
      <div className="testHubOptions">
        <Link href="/w/DEMO26" className="testHubOption"><div className="iconBadge mint"><FlaskConical size={21}/></div><div><span>المشارك</span><h2>ابدأ الرحلة كاملة</h2><p>أسلوبي → التقرير → المنتج → L1/L2/L3 → التشخيص → بلوم → الدرس → طلب الدراسة.</p></div><ExternalLink size={18}/></Link>
        <Link href="/workshop/demo-live" className="testHubOption"><div className="iconBadge blue"><BarChart3 size={21}/></div><div><span>المدرب</span><h2>افتح لوحة المجموعة</h2><p>راقب عدد المشاركين، توزيع W/O/V/T/K، ومستويات تقدم المنتج بشكل حي.</p></div><ExternalLink size={18}/></Link>
      </div>
      <div className="testCodeBox"><QrCode size={20}/><div><span>رمز الجلسة التجريبية</span><b>DEMO26</b></div></div>
    </section>
  </main>
}
