import Link from "next/link";

import { ArrowIcon, ClockIcon, CodeIcon, ListIcon, ShieldIcon } from "@/components/icons";

const exams = [
  {
    href: "/html",
    label: "آزمون HTML",
    category: "مبانی ساخت صفحات وب",
    description: "ساختار سند، تگ‌های معنایی، فرم‌ها و رسانه‌ها را در یک آزمون کامل مرور کن.",
    detail: "۳۰ پرسش · ۳۵ دقیقه",
    accent: "html"
  },
  {
    href: "/css",
    label: "آزمون‌های CSS",
    category: "طراحی و چیدمان رابط",
    description: "دو بخش کاربردی از انتخاب‌کننده‌ها تا چیدمان، رسپانسیو و انیمیشن پیش روی توست.",
    detail: "۲ بخش · هر بخش ۴۰ پرسش",
    accent: "css"
  }
] as const;

export function ExamHub() {
  return (
    <main className="exam-hub">
      <section className="hub-hero page-shell" aria-labelledby="hub-title">
        <div className="hub-hero__content">
          <span className="eyebrow"><i /> پلتفرم سنجش مهارت وب</span>
          <h1 id="hub-title">با آزمون‌های هدفمند،<br /><span>یادگیریت را بسنج.</span></h1>
          <p>مجموعه‌ای رو‌به‌رشد از آزمون‌های عملی وب؛ زمان‌بندی دقیق، تصحیح امن و بازخورد روشن برای هر پاسخ.</p>
          <div className="hub-hero__actions">
            <a className="primary-button primary-button--large" href="#exams">مشاهده آزمون‌ها <ArrowIcon /></a>
            <Link className="hub-text-link" href="/html">شروع با HTML</Link>
          </div>
        </div>
        <aside className="hub-summary" aria-label="ویژگی‌های پلتفرم">
          <div className="hub-summary__top"><span><CodeIcon /></span><p>مسیر یادگیری تو</p></div>
          <strong>سنجش، بازخورد، پیشرفت</strong>
          <div className="hub-summary__stats">
            <span><b>۳</b> آزمون فعال</span>
            <span><b>۱۱۰</b> پرسش کاربردی</span>
          </div>
          <div className="hub-summary__line"><i /> آمادهٔ شروعی؟</div>
        </aside>
      </section>

      <section className="hub-features page-shell" aria-label="ویژگی‌های آزمون‌ها">
        <article><span><ClockIcon /></span><div><strong>زمان‌بندی شفاف</strong><p>زمان آزمون پس از شروع ثابت می‌ماند.</p></div></article>
        <article><span><ShieldIcon /></span><div><strong>ارزیابی امن</strong><p>پاسخ‌ها فقط هنگام ثبت نهایی تصحیح می‌شوند.</p></div></article>
        <article><span><ListIcon /></span><div><strong>بازخورد کاربردی</strong><p>پاسخ‌نامه و نکتهٔ آموزشی هر سؤال را ببین.</p></div></article>
      </section>

      <section className="hub-exams page-shell" id="exams" aria-labelledby="exams-title">
        <div className="hub-section-heading"><div><span className="eyebrow"><i /> آزمون‌های موجود</span><h2 id="exams-title">از همین‌جا مسیرت را انتخاب کن</h2></div><p>آزمون‌های جدید به‌مرور به این مجموعه اضافه می‌شوند.</p></div>
        <div className="hub-exam-grid">
          {exams.map((exam) => (
            <article className={`hub-exam-card hub-exam-card--${exam.accent}`} key={exam.href}>
              <span className="hub-exam-card__label">{exam.category}</span>
              <h3>{exam.label}</h3>
              <p>{exam.description}</p>
              <div><span>{exam.detail}</span><Link href={exam.href} aria-label={`ورود به ${exam.label}`}>ورود <ArrowIcon /></Link></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
