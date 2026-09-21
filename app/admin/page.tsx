"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpenCheck, Building2, CheckCircle2, GraduationCap,
  LayoutDashboard, Plus, School, ShieldCheck, Sparkles, UserPlus, UsersRound
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Org = { id: string; name: string; organization_type: string; status: string };
type Program = { id: string; title: string; status: string; delivery_mode: string };
type Profile = { id?: string; email?: string | null; full_name: string | null; role: string; organization_id: string | null };

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [accounts, setAccounts] = useState<Profile[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [schoolName, setSchoolName] = useState("");
  const [schoolType, setSchoolType] = useState("school");

  const [programTitle, setProgramTitle] = useState("");
  const [programAudience, setProgramAudience] = useState("المعلمون");
  const [deliveryMode, setDeliveryMode] = useState("blended");

  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountRole, setAccountRole] = useState("teacher");
  const [accountOrg, setAccountOrg] = useState("");

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const [{ data: p }, { data: o }, { data: pr }, { data: ac }] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,role,organization_id").eq("id", user.id).maybeSingle(),
        supabase.from("organizations").select("id,name,organization_type,status").order("created_at", { ascending: false }),
        supabase.from("training_programs").select("id,title,status,delivery_mode").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,email,full_name,role,organization_id").order("full_name")
      ]);

      setProfile(p as Profile | null);
      setOrgs((o ?? []) as Org[]);
      setPrograms((pr ?? []) as Program[]);
      setAccounts((ac ?? []) as Profile[]);
      if (!accountOrg && o?.[0]?.id) setAccountOrg(o[0].id);
    } catch {
      setNotice("تعذر تحميل بيانات الإدارة.");
    }
  }

  const canManage = useMemo(
    () => profile?.role === "platform_admin" || profile?.role === "admin",
    [profile]
  );

  async function createOrganization(e: FormEvent) {
    e.preventDefault();
    if (!schoolName.trim()) return;
    setBusy(true); setNotice("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("organizations").insert({
        name: schoolName.trim(),
        organization_type: schoolType,
        status: "active"
      });
      if (error) throw error;
      setSchoolName("");
      setNotice("تم إنشاء الجهة بنجاح.");
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "تعذر إنشاء الجهة.");
    } finally { setBusy(false); }
  }

  async function createProgram(e: FormEvent) {
    e.preventDefault();
    if (!programTitle.trim()) return;
    setBusy(true); setNotice("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await supabase.from("training_programs").insert({
        title: programTitle.trim(),
        audience: programAudience.trim(),
        delivery_mode: deliveryMode,
        status: "draft",
        created_by: sessionData.session?.user.id ?? null
      });
      if (error) throw error;
      setProgramTitle("");
      setNotice("تم إنشاء البرنامج التدريبي كمسودة.");
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "تعذر إنشاء البرنامج.");
    } finally { setBusy(false); }
  }

  async function updateProgramStatus(programId:string,status:"draft"|"published"|"archived") {
    setBusy(true); setNotice("");
    try {
      const supabase=getSupabaseBrowserClient();
      const {error}=await supabase.from("training_programs").update({status,updated_at:new Date().toISOString()}).eq("id",programId);
      if(error) throw error;
      setNotice(status==="published"?"تم نشر البرنامج وأصبح جاهزًا لربط الورش.":status==="archived"?"تمت أرشفة البرنامج.":"تمت إعادة البرنامج إلى المسودة.");
      await refresh();
    } catch(e) { setNotice(e instanceof Error?e.message:"تعذر تحديث حالة البرنامج."); }
    finally { setBusy(false); }
  }

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    if (!accountEmail || !accountName || !accountPassword) return;
    const requiresOrg = accountRole === "teacher" || accountRole === "school_admin";
    if (requiresOrg && !accountOrg) {
      setNotice("اختر جهة للحساب.");
      return;
    }

    setBusy(true); setNotice("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.functions.invoke("invite-platform-user", {
        body: {
          email: accountEmail,
          password: accountPassword,
          full_name: accountName,
          role: accountRole,
          organization_id: (accountRole === "platform_admin" || accountRole === "trainer" || accountRole === "supervisor") ? null : accountOrg
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAccountName("");
      setAccountEmail("");
      setAccountPassword("");
      setNotice("تم إنشاء الحساب. يمكن للمستخدم الدخول مباشرة بالبريد الإلكتروني وكلمة المرور.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "تعذر إنشاء الحساب.");
    } finally { setBusy(false); }
  }

  if (!profile) {
    async function signOut(){
    const supabase=getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href="/login";
  }

  return (
      <main className="adminGate">
        <div className="adminGateCard refinedGate">
          <div className="differenceMark"><span>ت</span></div>
          <h1>إدارة «التمايز»</h1>
          <p>سجّل الدخول بحساب مدير المنصة للوصول إلى البرامج والمدارس والحسابات.</p>
          <Link className="primaryButton" href="/login">تسجيل الدخول <ArrowLeft size={17}/></Link>
        </div>
      </main>
    );
  }

  if (!canManage) {
    return (
      <main className="adminGate">
        <div className="adminGateCard refinedGate">
          <CheckCircle2 size={32}/>
          <h1>الحساب متصل</h1>
          <p>هذا الحساب لا يملك صلاحية مدير المنصة.</p>
          <Link className="outlineButton" href="/">العودة</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="adminPage refinedAdminPage">
      <header className="adminHeader premiumAdminHeader">
        <div className="adminBrandLine">
          <div className="differenceMark small"><span>ت</span></div>
          <div>
            <span className="sectionKicker">إدارة منصة التمايز</span>
            <h1>مركز القيادة</h1>
            <p>ابدأ من البرنامج التدريبي، أنشئ المدارس والحسابات، ثم تابع رحلة التطبيق طوال العام.</p>
          </div>
        </div>
        <div className="adminHeaderActions"><Link href="/admin/training" className="primaryButton">الورشة والتأهيل</Link><Link href="/admin/workshops" className="outlineButton">إدارة الورش</Link><Link href="/workshop/test" className="outlineButton">اختبار شامل</Link><button type="button" className="outlineButton" onClick={()=>void signOut()}>تسجيل الخروج</button></div>
      </header>

      {notice && <div className="adminNotice">{notice}</div>}

      <section className="adminStats premiumStats">
        <article><Building2 size={20}/><div><strong>{orgs.length}</strong><span>جهة ومدرسة</span></div></article>
        <article><GraduationCap size={20}/><div><strong>{programs.length}</strong><span>برنامج تدريبي</span></div></article>
        <article><UsersRound size={20}/><div><strong>نشط</strong><span>إدارة الحسابات</span></div></article>
        <article><ShieldCheck size={20}/><div><strong>آمن</strong><span>صلاحيات حسب الدور</span></div></article>
      </section>

      <section className="adminJourney premiumJourney">
        <div className="journeyStep active"><span>1</span><b>البرنامج التدريبي</b><small>بناء الورشة ومسار الاجتياز</small></div>
        <div className="journeyLine"/>
        <div className="journeyStep"><span>2</span><b>الجهات والحسابات</b><small>مدرسة أو معلم مستقل</small></div>
        <div className="journeyLine"/>
        <div className="journeyStep"><span>3</span><b>الفصول والتشخيص</b><small>بيانات التعلم وخريطة الإتقان</small></div>
        <div className="journeyLine"/>
        <div className="journeyStep"><span>4</span><b>التطبيق</b><small>درس، تنفيذ، أثر، توصية جديدة</small></div>
      </section>

      <section className="adminGrid refinedAdminGrid">
        <article className="adminCard premiumCard">
          <div className="adminCardHead">
            <div className="iconBadge mint"><GraduationCap size={20}/></div>
            <div><span>المرحلة الأولى</span><h2>إنشاء برنامج / ورشة</h2></div>
          </div>
          <form onSubmit={createProgram} className="adminForm">
            <label>اسم البرنامج<input value={programTitle} onChange={e=>setProgramTitle(e.target.value)} placeholder="مثال: التمايز في الفصل" required/></label>
            <label>الفئة المستهدفة<input value={programAudience} onChange={e=>setProgramAudience(e.target.value)} /></label>
            <label>نمط التنفيذ<select value={deliveryMode} onChange={e=>setDeliveryMode(e.target.value)}><option value="blended">مدمج</option><option value="in_person">حضوري</option><option value="online">عن بعد</option></select></label>
            <button className="primaryButton" disabled={busy}><Plus size={17}/> إنشاء البرنامج</button>
          </form>
          <div className="adminMiniList">
            {programs.slice(0,4).map(p=><div key={p.id} className="programMiniRow"><BookOpenCheck size={16}/><div><b>{p.title}</b><span>{p.status === "draft" ? "مسودة" : p.status === "published" ? "منشور" : "مؤرشف"}</span></div><div className="miniRowActions">{p.status!=="published"&&<button type="button" onClick={()=>void updateProgramStatus(p.id,"published")}>نشر</button>}{p.status==="published"&&<button type="button" onClick={()=>void updateProgramStatus(p.id,"archived")}>أرشفة</button>}{p.status==="archived"&&<button type="button" onClick={()=>void updateProgramStatus(p.id,"draft")}>إعادة</button>}</div></div>)}
            {programs.length === 0 && <p>ابدأ بإنشاء البرنامج الأول.</p>}
          </div>
        </article>

        <article className="adminCard premiumCard">
          <div className="adminCardHead">
            <div className="iconBadge blue"><School size={20}/></div>
            <div><span>المرحلة الثانية</span><h2>إنشاء جهة / مدرسة</h2></div>
          </div>
          <form onSubmit={createOrganization} className="adminForm">
            <label>اسم الجهة<input value={schoolName} onChange={e=>setSchoolName(e.target.value)} placeholder="اسم المدرسة أو الجهة" required/></label>
            <label>نوع الجهة<select value={schoolType} onChange={e=>setSchoolType(e.target.value)}><option value="school">مدرسة</option><option value="individual">معلم مستقل</option><option value="training_provider">جهة تدريب</option></select></label>
            <button className="primaryButton" disabled={busy}><Plus size={17}/> إنشاء الجهة</button>
          </form>
          <div className="adminMiniList">
            {orgs.slice(0,4).map(o=><div key={o.id}><Building2 size={16}/><div><b>{o.name}</b><span>{o.organization_type === "school" ? "مدرسة" : o.organization_type === "individual" ? "مستقل" : "جهة تدريب"}</span></div></div>)}
            {orgs.length === 0 && <p>لا توجد جهات بعد.</p>}
          </div>
        </article>

        <article className="adminCard premiumCard wideCard accountCreatorCard">
          <div className="adminCardHead">
            <div className="iconBadge peachIcon"><UserPlus size={20}/></div>
            <div><span>إدارة الحسابات</span><h2>إنشاء حساب جديد</h2></div>
          </div>

          <div className="accountCreatorIntro">
            <div>
              <b>بسيطة ومباشرة</b>
              <p>الاسم + البريد الإلكتروني + كلمة المرور + الدور. بعدها يستطيع المستخدم الدخول فورًا.</p>
            </div>
            <span>لا دعوات بريدية</span>
          </div>

          <form onSubmit={createAccount} className="adminForm accountForm">
            <label>الاسم<input value={accountName} onChange={e=>setAccountName(e.target.value)} placeholder="الاسم الكامل" required/></label>
            <label>البريد الإلكتروني<input type="email" value={accountEmail} onChange={e=>setAccountEmail(e.target.value)} placeholder="name@example.com" required/></label>
            <label>كلمة المرور<input type="password" minLength={8} value={accountPassword} onChange={e=>setAccountPassword(e.target.value)} placeholder="8 أحرف على الأقل" required/></label>
            <label>الدور<select value={accountRole} onChange={e=>setAccountRole(e.target.value)}>
              <option value="teacher">معلم</option>
              <option value="school_admin">مدير مدرسة</option>
              <option value="trainer">مدرب</option>
              <option value="supervisor">مشرف</option>
              <option value="platform_admin">مدير منصة</option>
            </select></label>

            {(accountRole === "teacher" || accountRole === "school_admin") && (
              <label>الجهة<select value={accountOrg} onChange={e=>setAccountOrg(e.target.value)} required>
                <option value="">اختر الجهة</option>
                {orgs.map(o=><option value={o.id} key={o.id}>{o.name}</option>)}
              </select></label>
            )}

            <button className="primaryButton createAccountButton" disabled={busy || ((accountRole === "teacher" || accountRole === "school_admin") && orgs.length===0)}>
              <UserPlus size={17}/> إنشاء الحساب
            </button>
          </form>

          <div className="adminHint"><Sparkles size={17}/><p>بعد إنشاء الحساب يمكن ربط المعلم بالبرنامج التدريبي، ثم تفعيل رحلة التطبيق بعد استيفاء شروط البرنامج.</p></div>
        </article>

        <article className="adminCard premiumCard wideCard">
          <div className="adminCardHead">
            <div className="iconBadge mint"><UsersRound size={20}/></div>
            <div><span>الحسابات الحالية</span><h2>مديرو المنصة والمدربون والمعلمون</h2></div>
          </div>
          <div className="adminMiniList accountRoster">
            {accounts.map(a=><div key={a.id || a.email || a.full_name || Math.random().toString()}><UsersRound size={16}/><div><b>{a.full_name || "بدون اسم"}</b><span>{a.email || "—"} • {a.role==="platform_admin"?"مدير منصة":a.role==="trainer"?"مدرب":a.role==="teacher"?"معلم":a.role==="school_admin"?"مدير مدرسة":a.role}</span></div></div>)}
            {accounts.length===0&&<p>لا توجد حسابات ظاهرة.</p>}
          </div>
          <div className="adminHint"><ShieldCheck size={17}/><p>حساب مدير المنصة الحالي مؤكد ومربوط بدور <b>platform_admin</b>. حساب المدرب لا يحتاج جهة ويمكن إسناده لأي ورشة من صفحة إدارة الورش.</p></div>
        </article>
      </section>

      <section className="adminNext refinedNext">
        <div>
          <span className="sectionKicker">المحطة التالية</span>
          <h2>الفصول → التشخيص → خريطة الإتقان</h2>
          <p>عند اكتمال الحسابات والفصول، ستبني «التمايز» خطط التعلم اعتمادًا على بيانات الطلاب الفعلية.</p>
        </div>
        <span className="nextTag">Learning Intelligence</span>
      </section>
    </main>
  );
}
