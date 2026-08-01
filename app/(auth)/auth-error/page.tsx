import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main id="main-content" className="auth-page page-shell">
      <section className="auth-card" aria-labelledby="auth-error-title">
        <h1 id="auth-error-title">ورود انجام نشد</h1>
        <p>اطلاعات ورود را بررسی کنید یا چند لحظه بعد دوباره تلاش کنید.</p>
        <Link className="primary-button" href="/login">بازگشت به ورود</Link>
      </section>
    </main>
  );
}
