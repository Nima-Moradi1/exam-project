import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { ShieldIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "";
  const isAdminLogin = callbackUrl === "/admin" || callbackUrl.startsWith("/admin/");
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return (
    <main id="main-content" className={`auth-page page-shell${isAdminLogin ? " auth-page--admin" : ""}`}>
      <section className={`auth-card${isAdminLogin ? " auth-card--admin" : ""}`} aria-labelledby="login-title">
        {isAdminLogin && <span className="admin-login__badge"><ShieldIcon /></span>}
        <span className="eyebrow"><i /> {isAdminLogin ? "دسترسی مدیریت" : "حساب کاربری"}</span>
        <h1 id="login-title">{isAdminLogin ? "ورود به پنل مدیریت" : "ورود به آزمون‌خانه"}</h1>
        <p>{isAdminLogin ? "با حساب دارای دسترسی مدیریتی وارد شوید تا به داشبورد مدیریت آزمون‌خانه منتقل شوید." : "برای شروع، ادامه‌دادن و مشاهدهٔ نتیجه‌ها وارد حساب خود شوید."}</p>
        <LoginForm googleEnabled={isAdminLogin ? false : googleEnabled} adminLogin={isAdminLogin} />
        {isAdminLogin ? <div className="auth-footer auth-footer--admin"><span>کاربر عادی هستید؟</span><Link href="/login">ورود به حساب کاربری</Link></div> : <div className="auth-footer"><span>حساب ندارید؟ <Link href="/signup">ثبت‌نام کنید</Link></span></div>}
      </section>
    </main>
  );
}
