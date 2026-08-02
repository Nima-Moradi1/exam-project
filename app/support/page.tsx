import { PolicyPage } from "@/components/policy-page";
import { publicMetadata } from "@/lib/seo/metadata";

export const metadata = publicMetadata({ title: "پشتیبانی", description: "راه ارتباط امن برای مشکلات حساب، دسترسی، آزمون و نتیجه.", pathname: "/support" });

export default function SupportPage() { return <PolicyPage eyebrow="همراه شما" title="پشتیبانی آزمون‌خانه" intro="برای مشکل حساب، دسترس‌پذیری، پرداخت احتمالی یا اجرای آزمون، پیام کوتاه و بدون اطلاعات حساس بفرستید."><h2>راه ارتباط</h2><p><a href="mailto:nimamoradirad@gmail.com?subject=Exam%20Platform%20Support">ارسال ایمیل به پشتیبانی</a></p><h2>چه چیزی بنویسم؟</h2><p>نشانی صفحه، زمان رخداد، مرورگر و شناسهٔ تلاش را بنویسید. رمز عبور، توکن، متن پاسخ یا تصویر کلید آزمون را ارسال نکنید.</p><h2>رخداد هنگام آزمون</h2><p>صفحه را باز نگه دارید، وضعیت ذخیره را بررسی کنید و شناسهٔ تلاش را یادداشت کنید. شروع تلاش تازه ممکن است محدودیت‌های آزمون را مصرف کند.</p></PolicyPage>; }
