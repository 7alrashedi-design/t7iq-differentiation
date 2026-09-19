import { test, expect } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "https://diff.t7iq.com";

async function screenshot(page:any, name:string){
  await page.screenshot({path:`test-results/${name}.png`, fullPage:true});
}

async function scoreVisibleRubric(page:any){
  const cards=page.locator(".rubricCriterion");
  await expect(cards.first()).toBeVisible({timeout:30000});
  const count=await cards.count();
  expect(count).toBeGreaterThan(0);
  for(let i=0;i<count;i++){
    const card=cards.nth(i);
    const buttons=card.locator(".rubricScale button");
    await buttons.nth(6).click();
    const note=card.locator("textarea");
    if(await note.count()) await note.fill("أداء واضح ومدعوم بأدلة؛ استمر في تعميق الجودة في المحاولة القادمة.");
  }
  const qs=page.locator(".qualitativeSummary textarea");
  if(await qs.count()>=3){
    await qs.nth(0).fill("المنتج يحقق الهدف ويظهر جودة متقدمة مع فرصة لزيادة عمق الأدلة.");
    await qs.nth(1).fill("تعميق المحتوى وربط الأدلة بصورة أوضح.");
    await qs.nth(2).fill("إضافة مثال تطبيقي جديد ثم مقارنة أثر التحسين.");
  }
}

test("رحلة الورشة كاملة بصريًا ووظيفيًا", async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({width:1440,height:1000});

  await page.goto(`${BASE}/w/DEMO26`, {waitUntil:"networkidle"});
  await expect(page.getByRole("heading",{name:/ورشة التمايز/})).toBeVisible();
  await screenshot(page,"01-join-desktop");

  await page.getByLabel("الاسم").fill("__E2E_VISUAL__");
  await page.getByLabel("الجهة").fill("اختبار آلي");
  await page.getByRole("button",{name:/دخول الجلسة/}).click();
  await expect(page.getByText(/العبارة 1 من 50/)).toBeVisible();

  for(let i=0;i<50;i++){
    await page.locator(".answerScale button").nth(3).click();
    if(i<49) await page.waitForTimeout(320);
  }
  await page.getByRole("button",{name:/إظهار بصمتي/}).click();
  await expect(page.locator(".reportPage")).toBeVisible({timeout:30000});
  await expect(page.getByText("بصمتك التعبيرية").first()).toBeVisible({timeout:30000});
  await screenshot(page,"02-fingerprint-report");

  await page.emulateMedia({media:"print"});
  const pdf=await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true});
  fs.writeFileSync("test-results/fingerprint-report.pdf",pdf);
  expect(pdf.byteLength).toBeGreaterThan(15000);
  await page.emulateMedia({media:"screen"});

  await page.getByRole("button",{name:/استكشف المنتجات/}).click();
  await expect(page.getByRole("heading",{name:/اختر المنتج/})).toBeVisible();
  await screenshot(page,"03-products-desktop");
  await page.setViewportSize({width:390,height:844});
  await screenshot(page,"04-products-mobile");
  await page.setViewportSize({width:1440,height:1000});

  await page.locator(".productCard").first().getByRole("button",{name:/اختيار هذا المنتج/}).click();
  await expect(page.getByText(/تقييم مختلط/)).toBeVisible({timeout:20000});
  await expect(page.locator(".rubricCriterion").first()).toBeVisible({timeout:30000});
  await screenshot(page,"05-evaluation-desktop");
  await page.setViewportSize({width:390,height:844});
  await screenshot(page,"06-evaluation-mobile");
  await page.setViewportSize({width:1440,height:1000});

  for(const level of [1,2,3]){
    await scoreVisibleRubric(page);
    await page.getByRole("button",{name:new RegExp(`تقييم المستوى ${level}`)}).click();
    await expect(page.getByText(new RegExp(level===3?"اكتمل مسار تطوير المنتج":`تم اجتياز المستوى ${level}`))).toBeVisible({timeout:20000});
    await screenshot(page,`07-level-${level}-result`);
    if(level<3){
      await page.getByRole("button",{name:new RegExp(`فتح المستوى ${level+1}`)}).click();
      await expect(page.getByText(/تغيّر سقف التحدي|لا نبحث عن منتج جيد فقط/)).toBeVisible();
      await page.getByRole("button",{name:new RegExp(`ابدأ المستوى ${level+1}`)}).click();
      await expect(page.locator(".rubricCriterion").first()).toBeVisible({timeout:20000});
    }
  }

  await page.getByRole("button",{name:/اكتمل المستوى الثالث/}).click();
  await expect(page.getByText(/المحطة السادسة/)).toBeVisible({timeout:20000});
  await screenshot(page,"10-station-six-default");

  await page.getByLabel("المادة").fill("علوم");
  await page.getByLabel("الدرس").fill("الطاقة في الخلية");
  await page.getByLabel("عدد الطلاب").fill("30");
  await expect(page.getByText("30")).toBeVisible();
  await screenshot(page,"11-station-six-custom-lesson");

  await page.getByRole("button",{name:/شاهد تمايز المحتوى/}).click();
  await expect(page.getByRole("heading",{name:/الطاقة في الخلية/})).toBeVisible();
  await screenshot(page,"12-differentiated-paths");

  await page.getByRole("button",{name:/ابنِ الدرس الكامل/}).click();
  await expect(page.getByRole("heading",{name:/علوم — الطاقة في الخلية/})).toBeVisible();
  await screenshot(page,"13-generated-lesson");

  await page.getByRole("button",{name:/إنهاء التجربة وما بعد الورشة/}).click();
  await page.getByRole("button",{name:/عرض تقريري الختامي/}).click();
  await expect(page.getByText("رحلتي في التمايز")).toBeVisible({timeout:20000});
  await screenshot(page,"14-final-report");

  await page.emulateMedia({media:"print"});
  const finalPdf=await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true});
  fs.writeFileSync("test-results/final-report.pdf",finalPdf);
  expect(finalPdf.byteLength).toBeGreaterThan(15000);
});
