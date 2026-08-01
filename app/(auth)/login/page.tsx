import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return (
    <main id="main-content" className="auth-page page-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <span className="eyebrow"><i /> حساب کاربری</span>
        <h1 id="login-title">ورود به آزمون‌خانه</h1>
        <p>برای شروع، ادامه‌دادن و مشاهدهٔ نتیجه‌ها وارد حساب خود شوید.</p>
        <LoginForm googleEnabled={googleEnabled} />
        <p className="auth-footer">حساب ندارید؟ <Link href="/signup">ثبت‌نام کنید</Link></p>
      </section>
    </main>
  );
}
