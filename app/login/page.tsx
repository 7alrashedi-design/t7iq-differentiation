"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      setMessage(error ? "تعذر تسجيل الدخول. تأكد أن حسابك مفعل ضمن البرنامج." : "أرسلنا رابط الدخول إلى بريدك الإلكتروني.");
    } catch {
      setMessage("تعذر الاتصال بخدمة الدخول حاليًا.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="loginPage">
      <div className="loginVisual">
        <div className="loginBrand"><span>T7</span><b>T7IQ</b></div>
        <div className="loginStory">
          <span className="smartBadge"><Sparkles size={15}/> تعلم يتكيف مع طلابك</span>
          <h1>من الورشة إلى الفصل، معك خطوة بخطوة.</h1>
          <p>حساب المعلم يفعّل بعد إكمال البرنامج التدريبي، ثم ترافقه المنصة طوال العام الدراسي.</p>
        </div>
      </div>

      <section className="loginCard">
        <Link href="/" className="backLink"><ArrowRight size={17}/> العودة للمنصة</Link>
        <div className="loginIcon"><KeyRound size={24}/></div>
        <h2>دخول المعلمين</h2>
        <p>استخدم البريد المسجل في البرنامج التدريبي.</p>

        <form onSubmit={submit}>
          <label>البريد الإلكتروني</label>
          <div className="inputWrap"><Mail size={18}/><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.com"/></div>
          <button className="primaryButton loginSubmit" disabled={busy}>{busy ? "جارٍ الإرسال..." : "إرسال رابط الدخول"}</button>
        </form>

        {message && <div className="loginMessage">{message}</div>}
        <small>لا يتم إنشاء حساب جديد من هذه الصفحة. الحسابات تفعّل للمشاركين المعتمدين في البرنامج.</small>
      </section>
    </main>
  );
}
