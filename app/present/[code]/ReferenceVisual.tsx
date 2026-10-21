"use client";
import type {CSSProperties} from "react";
import "./reference.css";
type Props={page:number; title:string; body:string};
const bloom=["التذكر","الفهم","التطبيق","التحليل","التقييم","الإبداع"];
const palette=["#1f8fca","#2ca9cf","#70c5df","#f7c66b","#b0d977","#a8d4e8"];
const steps=[
["النجاح السهل","أداء المهمات التي يعرفها الطالب مسبقًا"],
["النجاح مع التحدي","تجربة مهام أكثر عمقًا وصعوبة"],
["التعلم مدى الحياة","استقلال التعلم والاستمرار في النمو"]
];
const productKinds=[["التقنية","#a9dfff","تطبيق، برمجة، فيديو"],["الشفهية","#ffd8ad","عرض، مقابلة، حوار"],["الحركية","#e2f2ac","نموذج، تجربة، محاكاة"],["المرئية","#d9d3f6","ملصق، مخطط، رسم"],["الكتابية","#cee4f5","تقرير، مقالة، قصة"]];
const ladder=[["الإبداع","ابتكار حلول جديدة"],["التقييم","إصدار أحكام مبررة"],["التحليل","فحص العلاقات والأنماط"],["التطبيق","استخدام المعرفة"],["الفهم","تفسير المعلومات"],["التذكر","استرجاع المعلومات"]];
function Tiles({items}:{items:Array<[string,string]>}){return <div className="rawasTiles">{items.map(([name,desc],i)=><div className="rawasTile" key={i} style={{"--tile-color":palette[i%palette.length]} as CSSProperties}><b>{name}</b><span>{desc}</span></div>)}</div>}
function Table({page}:{page:number}){const topic=page>=31?"الأعداد":page===27?"موضوع الوحدة":"مستويات بلوم";const products=page===31||page===32||page===33||page===36?["بطاقة أو صورة","شرح مرئي","تقرير مصغر","مقارنة","نقد وبرهان","نموذج إبداعي"]:["بطاقة تذكر","شرح مرئي","تطبيق","بحث وتحليل","تقويم مبرر","مشروع ابتكاري"];return <div className="rawasTableWrap"><div className="rawasTableTitle">{page===27?"نموذج تخطيط الدرس / الوحدة وفق بلوم المعدل":page===28?"ربط تصنيف بلوم بالمنتجات التعليمية":page===31?"النموذج الموجز للمعلم":page===32?"النموذج التفصيلي للمعلم":page===33?"نموذج تخطيطي للطالب":"صياغة الأداء والمنتج في مراكز التعلم"}</div><div className="rawasTable"><div className="rawasTableHead">مستوى بلوم</div><div className="rawasTableHead">العملية</div><div className="rawasTableHead">المحتوى</div><div className="rawasTableHead">المنتج</div>{[...bloom].reverse().map((level,i)=><div className="rawasTableRow" key={level}><strong>{level}</strong><span>{["يبتكر","يبرر","يحلل","يطبق","يشرح","يحدد"][i]}</span><span>{topic}</span><span>{products[5-i]}</span></div>)}</div><small>تخطيط بصري قابل للتطوير؛ محتوى الخلايا التفصيلي في الأصل يحتاج مطابقة وتحرير مع المدرب.</small></div>}
function Treffers(){return <div className="rawasPyramid">{[["القليل من الأطفال","دعم فردي مركز"],["بعض الأطفال","خدمات إضافية"],["الكثير من الأطفال","خبرات إثرائية أوسع"],["جميع الأطفال","خبرات تعلم متنوعة"]].map(([a,b],i)=><div key={a} className="rawasPyramidLevel" style={{width:(43+i*19)+"%",background:["#e7ae34","#eed866","#83c47d","#55afc3"][i]}}><b>{a}</b><small>{b}</small></div>)}</div>}
function KWL(){return <div className="rawasKWL">{["ماذا أعرف؟","ماذا أريد أن أعرف؟","ماذا تعلمت؟","ماذا أريد أن أفعل؟"].map((x,i)=><section key={x}><b>{x}</b><div>{Array.from({length:5},(_,j)=><i key={j}/>)}</div></section>)}</div>}
export default function ReferenceVisual({page,title,body}:Props){
 if([0,1,2,3,6,8,10,12,15,16,18,19,21,24,29,34,37].includes(page))return null;
 if(page===4)return <div className="rawasVisual"><h3>مستويات النجاح الأكاديمي</h3><div className="rawasSteps">{steps.map(([x,y],i)=><div key={x} style={{transform:`translateY(${(2-i)*8}%)`}}><span>{i+1}</span><strong>{x}</strong><small>{y}</small></div>)}</div></div>;
 if(page===5)return <div className="rawasVisual"><h3>استراتيجيات تعزيز النجاح الأكاديمي</h3><Tiles items={[["دعم التحدي","مساندة الطالب للتغلب على التحديات"],["تنمية الاهتمامات","اكتشاف الميول داخل المدرسة وخارجها"],["ترسيخ ثقافة الإتقان","الاستمرار في التقدم والتعلم"]]}/></div>;
 if(page===7)return <div className="rawasVisual"><h3>حقائق التمايز الفعال</h3><Tiles items={[["احتياجات متنوعة","الطلاب يختلفون في جاهزيتهم"],["عوائق التطبيق","التمايز يتطلب تنظيمًا"],["تعلم أفضل","الهدف هو التقدم"],["عدالة التعليم","الإنصاف يستجيب للاحتياجات"],["التقويم والتمايز","التقويم أساس القرار"],["أسئلة موجهة","ما الذي يحتاجه الطالب؟"]]}/></div>;
 if(page===9)return <div className="rawasVisual"><h3>أربعة محاور لتصميم التعليم المتمايز</h3><Tiles items={[["المحتوى","ماذا سيتعلم الطالب؟"],["العملية","كيف يتعامل مع المحتوى؟"],["المنتج","كيف يظهر فهمه؟"],["مناخ الفصل","كيف نجعل التعلم داعمًا؟"]]}/></div>;
 if(page===11)return <div className="rawasVisual"><h3>منتجات التعلم: المفهوم والفئات</h3><div className="rawasProducts">{productKinds.map(([label,c,desc])=><div style={{background:c}} key={label}><b>{label}</b><span>{desc}</span></div>)}</div></div>;
 if(page===13||page===14)return <div className="rawasVisual"><h3>نموذج تريفنجر للخدمة متعددة المستويات داخل الصف</h3><Treffers/></div>;
 if(page===17)return <div className="rawasVisual"><h3>مخطط أعرف – أريد أن أعرف – تعلمت – أريد أن أفعل</h3><KWL/></div>;
 if(page===20)return <div className="rawasVisual"><h3>الأسئلة الثلاثة للتمايز الفعال</h3><Tiles items={[["التخطيط","ماذا نريد أن يعرفه الطالب؟"],["التقييم القبلي","ما الذي يعرفه مسبقًا؟"],["تنفيذ التمايز","ما الدعم الذي يحقق التقدم؟"]]}/></div>;
 if(page===22)return <div className="rawasVisual"><h3>التخطيط لتجارب التعلم</h3><Tiles items={[["التقييم القبلي","تحديد مستوى الطالب"],["تكييف الدرس","تعديل الخبرات وفق الأدلة"],["مراعاة الاحتياجات","تنويع فرص التعلم"],["بلوم المعدل","تنويع عمق التفكير"]]}/></div>;
 if(page===23)return <div className="rawasVisual"><h3>مكونات تجربة التعلم المتمايز</h3><div className="rawasEquation"><span>المحتوى</span><b>+</b><span>العملية</span><b>+</b><span>المنتج</span><b>=</b><span>تجربة تعلم</span></div></div>;
 if(page===25)return <div className="rawasVisual"><h3>تصنيف بلوم المعدل</h3><div className="rawasLadder">{ladder.map(([x,y],i)=><div key={x} style={{background:["#d692cf","#5ba7ca","#edb86b","#d8cf60","#84c690","#72b9c5"][i]}}><b>{6-i} · {x}</b><span>{y}</span></div>)}</div></div>;
 if(page===26)return <div className="rawasVisual"><h3>بلوم والتعلم المتمايز</h3><Tiles items={[["المحتوى","ما الذي يتعلمه الطلاب؟"],["العملية","كيف يفكرون ويتعلمون؟"],["المنتج","كيف يُظهرون التعلم؟"],["التحدي المناسب","نعمق التعلم لكل متعلم"],["الإتقان والتقدم","تقويم مستمر للتحسن"]]}/></div>;
 if([27,28,31,32,33,36].includes(page))return <div className="rawasVisual"><Table page={page}/></div>;
 if(page===30)return <div className="rawasVisual"><h3>متى نستخدم بلوم المعدل داخل الصف العادي؟</h3><Tiles items={[["تفاوت الجاهزية","اختلاف المعرفة السابقة"],["اختيارات موجهة","أنشطة متعددة للاختيار"],["خبرات متمايزة","تغيير المحتوى والعملية والمنتج"],["وقت مرن","زمن مناسب للمهمة"]]}/></div>;
 if(page===35)return <div className="rawasVisual"><h3>متى نستخدم بلوم في مراكز التعلم؟</h3><Tiles items={[["إدارة الوقت","جدول واضح للمراكز"],["التنظيم المرن","مرونة العمل الفردي والجماعي"],["موارد جاهزة","تجهيز المواد والأدوات"],["تعاقد التعلم","توضيح المسؤوليات"],["خيارات متعددة","حرية المسارات"],["التقدم للجميع","تحدٍّ مناسب لكل طالب"]]}/></div>;
 return <div className="rawasVisual"><h3>{title}</h3><p>{body}</p></div>;
}
