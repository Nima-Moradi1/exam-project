import { PolicyPage } from "@/components/policy-page";
import { publicMetadata } from "@/lib/seo/metadata";

export const metadata = publicMetadata({ title: "بیانیهٔ دسترس‌پذیری", description: "تعهد آزمون‌خانه به WCAG 2.2 AA و راه ارتباط برای گزارش مانع دسترسی.", pathname: "/accessibility" });

export default function AccessibilityPage() { return <PolicyPage eyebrow="برای همه" title="بیانیهٔ دسترس‌پذیری" intro="هدف ما پشتیبانی از صفحه‌کلید، صفحه‌خوان، بزرگ‌نمایی، حرکت کاهش‌یافته و محتوای راست‌به‌چپ و چپ‌به‌راست بر پایهٔ WCAG 2.2 AA است."><h2>امکانات</h2><p>پرش به محتوا، نشانگر فوکوس، ساختار عنوان و landmark، برچسب کنترل‌ها، وضعیت‌های متنی و حداقل هدف لمسی در مسیرهای اصلی در نظر گرفته شده‌اند.</p><h2>محدودیت یا زمان اضافه</h2><p>اگر برای آزمون به زمان اضافه، قالب جایگزین یا کمک دسترسی نیاز دارید، پیش از شروع از صفحهٔ پشتیبانی اطلاع دهید.</p><h2>گزارش مشکل</h2><p>نام صفحه، دستگاه، مرورگر و شرح مانع را بفرستید؛ هیچ رمز یا پاسخ آزمون را ارسال نکنید.</p></PolicyPage>; }
