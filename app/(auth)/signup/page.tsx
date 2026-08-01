import { SignupForm } from "@/components/auth/signup-form";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main id="main-content" className="auth-page page-shell">
      <section className="auth-card" aria-labelledby="signup-title">
        <span className="eyebrow"><i /> شروع مسیر</span>
        <h1 id="signup-title">ساخت حساب کاربری</h1>
        <p>حساب شما تاریخچهٔ آزمون‌ها و پیشنهادهای آموزشی را نگه می‌دارد.</p>
        <SignupForm />
      </section>
    </main>
  );
}
