"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <html lang="fa" dir="rtl"><body><main id="main-content" className="state-page page-shell"><h1>مشکلی در نمایش صفحه پیش آمد</h1><p>اطلاعات حساس یا جزئیات فنی نمایش داده نمی‌شود. اتصال را بررسی و دوباره تلاش کنید.</p><button className="primary-button" type="button" onClick={reset}>تلاش دوباره</button></main></body></html>; }
