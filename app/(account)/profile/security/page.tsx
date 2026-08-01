import { PasswordForm } from "@/components/profile/password-form";

export default function SecurityPage() {
  return <main id="main-content" className="account-page page-shell"><section className="account-card" aria-labelledby="security-title"><h1 id="security-title">امنیت حساب</h1><p>پس از تغییر رمز عبور، نشست‌های فعال برای محافظت از حساب شما لغو می‌شوند.</p><PasswordForm /></section></main>;
}
