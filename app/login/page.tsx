"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        return;
      }

      const user = data.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "platform_admin" || profile?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    } catch {
      setMessage("تعذر الاتصال بخدمة الدخول حاليًا.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="loginPage">
      <section className="loginVisual differentiationVisual">
        <div className="platformBrand">
          <div className="differenceMark"><span>ت</span></div>
          <div>
            <b>التمايز</b>
            <small>منصة تعلم ذكية للمعلم</small>
          </div>
        </div>

        <div className="loginStory">
          <span className="smartBadge"><Sparkles size={15}/> تعلم يتقدم مع كل طالب</span>
          <h1>من التدريب إلى التطبيق… رحلة واحدة.</h1>
          <p>
            تساعد «التمايز» المعلم على الانتقال من فهم التمايز إلى ممارسته يوميًا،
            بخطط تعلم مبنية على تشخيص الطلاب وتقدمهم الحقيقي.
          </p>
          <div className="loginFeatureRow">
            <span>ورش تدريبية</span>
            <span>تشخيص ذكي</span>
            <span>تجارب تعلم متمايزة</span>
          </div>
        </div>
      </section>

      <section className="loginCard premiumLoginCard">
        <Link href="/" className="backLink"><ArrowRight size={17}/> العودة</Link>

        <div className="loginCardBrand">
          <div className="differenceMark small"><span>ت</span></div>
          <div>
            <span>مرحبًا بك في</span>
            <h2>التمايز</h2>
          </div>
        </div>

        <p>أدخل بيانات الحساب التي أنشأها لك مدير المنصة.</p>

        <form onSubmit={submit}>
          <label>البريد الإلكتروني</label>
          <div className="inputWrap">
            <Mail size={18}/>
            <input
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <label className="passwordLabel">كلمة المرور</label>
          <div className="inputWrap">
            <LockKeyhole size={18}/>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" className="passwordToggle" onClick={()=>setShowPassword(v=>!v)} aria-label="إظهار كلمة المرور">
              {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
            </button>
          </div>

          <button className="primaryButton loginSubmit" disabled={busy}>
            {busy ? "جارٍ الدخول..." : "دخول المنصة"}
          </button>
        </form>

        {message && <div className="loginMessage">{message}</div>}
        <small>لا توجد عملية تسجيل ذاتي. جميع الحسابات تنشأ من إدارة المنصة أو إدارة المدرسة.</small>
      </section>
    </main>
  );
}
