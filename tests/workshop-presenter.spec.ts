import {test,expect} from "@playwright/test";
const BASE=process.env.BASE_URL||"https://diff.t7iq.com";
const getCanvas= (page:any)=>page.locator("canvas.exactSnapshotCanvas");
async function ensureSlide(page:any,number:number){
 await expect(getCanvas(page)).toBeVisible({timeout:45000});
 await expect(getCanvas(page)).toHaveAttribute("aria-label",new RegExp("الشريحة "+number+" من 38"),{timeout:45000});
 await expect(page.getByRole("button",{name:"التالي"})).toBeEnabled({timeout:45000}).catch(async()=>{
   if(number!==38)throw new Error("next disabled after slide render "+number);
 });
 await expect(page.getByText(new RegExp("الشريحة "+number+" / 38"))).toBeVisible({timeout:45000});
}
async function slideSignature(page:any){
 return getCanvas(page).evaluate((c:HTMLCanvasElement)=>{
  const data=c.getContext("2d")!.getImageData(0,0,c.width,c.height).data;
  let sum=2166136261;
  for(let i=0;i<data.length;i+=137)sum=Math.imul(sum ^ data[i],16777619);
  return sum>>>0;
 });
}
test("المشغل الموحد: انتقال الشرائح 1–38 والأنشطة في مواضعها",async({page})=>{
 test.setTimeout(180000);
 await page.setViewportSize({width:1366,height:900});
 await page.goto(BASE+"/present/DEMO26",{waitUntil:"domcontentloaded"});
 await ensureSlide(page,1);
 const first=await slideSignature(page);
 await page.getByRole("button",{name:"التالي"}).click();
 await ensureSlide(page,2);
 const second=await slideSignature(page);
 expect(second).not.toBe(first);
 await page.getByRole("button",{name:"التالي"}).click();
 await ensureSlide(page,3);
 const third=await slideSignature(page);
 expect(third).not.toBe(first);
 expect(third).not.toBe(second);
 await page.screenshot({path:"test-results/presenter-slide-3.png",fullPage:true});
 await page.getByRole("combobox",{name:"انتقال مباشر للشريحة"}).selectOption("11");
 await ensureSlide(page,11);
 await expect(page.getByRole("button",{name:"عرض QR لنشاط KWLR"})).toHaveCount(0);
 await page.getByRole("combobox",{name:"انتقال مباشر للشريحة"}).selectOption("16");
 await ensureSlide(page,16);
 await page.getByRole("button",{name:"عرض QR لنشاط KWLR"}).click();
 await expect(page.getByRole("dialog",{name:"الدخول إلى نشاط KWLR"})).toBeVisible();
 await expect(page.getByRole("img",{name:"رمز النشاط الخاص بجلسة KWLR الحالية"})).toBeVisible();
 await page.screenshot({path:"test-results/presenter-kwlr-qr.png",fullPage:true});
 await page.getByRole("button",{name:"إغلاق"}).click();
 await page.getByRole("combobox",{name:"انتقال مباشر للشريحة"}).selectOption("19");
 await ensureSlide(page,19);
 await expect(page.getByRole("button",{name:"عرض QR لنشاط KWLR"})).toHaveCount(0);
 await page.getByRole("combobox",{name:"انتقال مباشر للشريحة"}).selectOption("25");
 await ensureSlide(page,25);
 await page.getByRole("button",{name:"أدوات الأنشطة"}).click();
 await expect(page.getByRole("link",{name:"فتح مخطط بلوم"})).toBeVisible();
 await page.getByRole("button",{name:"إغلاق"}).click();
 await page.getByRole("combobox",{name:"انتقال مباشر للشريحة"}).selectOption("38");
 await expect(getCanvas(page)).toBeVisible();
 await expect(page.getByText(/الشريحة 38 \/ 38/)).toBeVisible({timeout:45000});
 await expect(page.getByRole("button",{name:"التالي"})).toBeDisabled();
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:"test-results/presenter-mobile-slide-38.png",fullPage:true});
});
