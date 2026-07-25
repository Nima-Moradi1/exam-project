import {
  ArrowIcon,
  CheckIcon,
  ClockIcon,
  ListIcon,
  ShieldIcon
} from "@/components/icons";

interface WelcomeScreenProps {
  onStart: () => void;
}

const instructions = [
  "آزمون شامل ۳۰ پرسش در چهار قالب متفاوت است.",
  "پس از شروع، ۳۵ دقیقه فرصت دارید و زمان با بستن صفحه هم ادامه پیدا می‌کند.",
  "پس از ثبت نهایی، نتیجه و پاسخ‌نامهٔ تشریحی نمایش داده می‌شود.",
  "برای هر پرسش تنها یک پاسخ در نظر گرفته شده است."
];

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcome page-shell">
      <section className="welcome__hero" aria-labelledby="welcome-title">
        <div className="eyebrow">
          <span />
          آماده‌ای دانشت را بسنجی؟
        </div>
        <h1 id="welcome-title">
          یک قدم تا تسلط بیشتر بر
          <span> HTML</span>
        </h1>
        <p>
          با یک آزمون جامع و کاربردی، دانسته‌هایت دربارهٔ ساختار صفحات وب،
          عناصر معنایی، فرم‌ها و رسانه‌ها را محک بزن.
        </p>

        <div className="exam-facts" aria-label="مشخصات آزمون">
          <div>
            <ListIcon />
            <span><strong>۳۰ پرسش</strong><small>چهار نوع سؤال</small></span>
          </div>
          <div>
            <ClockIcon />
            <span><strong>۳۵ دقیقه</strong><small>زمان ثابت آزمون</small></span>
          </div>
          <div>
            <ShieldIcon />
            <span><strong>ارزیابی امن</strong><small>تصحیح سمت سرور</small></span>
          </div>
        </div>

        <button className="primary-button primary-button--large" type="button" onClick={onStart}>
          شروع آزمون
          <ArrowIcon />
        </button>
        <p className="start-note">با شروع آزمون، زمان و پاسخ‌ها در همین مرورگر ذخیره می‌شوند و زمان قابل شروع مجدد نیست.</p>
      </section>

      <aside className="instruction-card" aria-labelledby="instructions-title">
        <span className="instruction-card__number">۳۰</span>
        <div className="instruction-card__top">
          <span className="instruction-card__icon"><ListIcon /></span>
          <div>
            <p>پیش از شروع</p>
            <h2 id="instructions-title">راهنمای آزمون</h2>
          </div>
        </div>
        <ul>
          {instructions.map((instruction) => (
            <li key={instruction}>
              <span><CheckIcon /></span>
              {instruction}
            </li>
          ))}
        </ul>
        <div className="question-mix">
          <span>ترکیب پرسش‌ها</span>
          <div aria-hidden="true">
            <i className="mix-description" />
            <i className="mix-dropdown" />
            <i className="mix-choice" />
            <i className="mix-boolean" />
          </div>
          <p>۳ تشریحی · ۱۰ کشویی · ۱۲ چهارگزینه‌ای · ۵ درست/نادرست</p>
        </div>
      </aside>
    </main>
  );
}
