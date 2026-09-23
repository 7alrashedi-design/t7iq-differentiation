# T7IQ Differentiation — منصة التمايز

منصة تعلم وتدريب ذكية تحت النطاق:

`diff.t7iq.com`

## المعمارية المعتمدة

- **ChatGPT Project**: التصميم والتطوير وإدارة رحلة المنتج.
- **GitHub**: المصدر الرسمي الوحيد للكود.
- **Hostinger VPS / Docker**: الاستضافة والنشر.
- **Supabase — T7IQ Differentiation**: قاعدة البيانات والمصادقة وRLS وEdge Functions.
- **n8n**: الأتمتة والتكاملات المستقبلية.

> قاعدة بيانات التمايز مستقلة بالكامل عن Tahaddi Academy.

## الفكرة

المنصة لا تبدأ من «إنشاء نشاط»، بل من **بيانات التعلم**.
تربط التدريب بالتطبيق، ثم التشخيص، والتمايز، والتنفيذ، والأثر.

## الجزء الأول — Workshop & Qualification

المسار:

`مدير المنصة → البرنامج → الورشة → المدرب → المتدرب → أسلوبي → البصمة → المنتج → L1/L2/L3 → التقرير → التأهيل`

اختبار القبول الإداري:

`/admin/training/acceptance`

## الجزء الثاني — School & Teacher

المسار المستهدف:

`المدرسة → المعلم → الفصل → الطلاب → التشخيص → مشروع التمايز → التنفيذ → الأثر → الكوتشينق`

## التشغيل محليًا

```bash
cp .env.example .env.local
npm ci
npm run dev
```

ثم افتح:

`http://localhost:3000`

## Quality Gate

قبل أي نشر:

```bash
npm ci
npm run typecheck
npm run build
```

كما يقوم GitHub Actions ببناء صورة Docker للتأكد من أن نسخة Hostinger قابلة للبناء.

## النشر على Hostinger

### المتغيرات المطلوبة

```env
NEXT_PUBLIC_SUPABASE_URL=https://mihalnbzprdqaaprjkha.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

### Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -t t7iq-differentiation .

docker run -d \
  --name t7iq-differentiation \
  --restart unless-stopped \
  -p 127.0.0.1:3100:3000 \
  t7iq-differentiation
```

أو باستخدام:

`docker-compose.hostinger.yml`

### Health Check

`/api/health`

ويجب أن يعيد HTTP 200.

### النطاق

النسخة الإنتاجية:

`https://diff.t7iq.com`

ويتم توجيهها من البوابة العكسية/Traefik إلى خدمة التمايز على المنفذ الداخلي 3000 أو منفذ المضيف 3100 بحسب إعداد الخادم.

## ملاحظات النشر

- لا تضع أسرارًا في GitHub.
- لا تنقل قاعدة Supabase الحالية إلى Hostinger في هذه المرحلة.
- لا يتم تعديل Tahaddi Academy أو قاعدة بياناته.
- Vercel ليس مسار النشر الأساسي بعد الآن، والنشر التلقائي عليه معطل أثناء الانتقال إلى Hostinger.
