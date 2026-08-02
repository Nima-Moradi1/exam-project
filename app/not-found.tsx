import Link from "next/link";

export default function NotFoundPage() { return <main id="main-content" className="state-page page-shell"><h1>این صفحه در دسترس نیست</h1><p>ممکن است نشانی تغییر کرده باشد یا محتوای موردنظر منتشر نشده باشد.</p><div><Link className="primary-button" href="/">بازگشت به خانه</Link><Link className="secondary-button" href="/#exams">پیداکردن آزمون</Link></div></main>; }
