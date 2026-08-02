import Link from "next/link";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const profile = await getDb().select({
    displayName: users.displayName,
    username: users.username,
    email: users.email,
    bio: users.bio,
    preferredLocale: users.preferredLocale,
    timezone: users.timezone,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, session.user.id)).limit(1).then((rows) => rows[0]);
  if (!profile) return null;
  const name = profile.displayName || profile.username || profile.email;
  const initial = name.trim().slice(0, 1).toLocaleUpperCase("fa-IR");

  return (
    <main id="main-content" className="account-page profile-page page-shell">
      <section className="account-card profile-card" aria-labelledby="profile-title">
        <Link className="account-back-link" href="/"><span aria-hidden="true">→</span> بازگشت به صفحهٔ اصلی</Link>
        <header className="profile-card__header">
          <div className="profile-avatar" aria-hidden="true">{initial}</div>
          <div>
            <span className="eyebrow"><i /> حساب من</span>
            <h1 id="profile-title">{name}</h1>
            <p>تنظیمات شخصی و سابقهٔ یادگیری‌تان را از اینجا مدیریت کنید.</p>
          </div>
        </header>
        <dl className="profile-details">
          <div><dt>نام کاربری</dt><dd dir={profile.username ? "ltr" : undefined}>{profile.username || "برای ورود با Google باید نام کاربری انتخاب کنید."}</dd></div>
          <div><dt>ایمیل</dt><dd dir="ltr">{profile.email}</dd></div>
          <div><dt>زبان ترجیحی</dt><dd>{profile.preferredLocale === "fa" ? "فارسی" : "English"}</dd></div>
          {profile.timezone && <div><dt>منطقهٔ زمانی</dt><dd dir="ltr">{profile.timezone}</dd></div>}
          {profile.bio && <div className="profile-details__bio"><dt>دربارهٔ من</dt><dd>{profile.bio}</dd></div>}
        </dl>
        <nav className="account-actions" aria-label="مدیریت حساب">
          <Link className="profile-action profile-action--primary" href="/profile/edit"><span>ویرایش پروفایل</span><small>نام، معرفی و زبان</small><b aria-hidden="true">←</b></Link>
          <Link className="profile-action" href="/profile/security"><span>امنیت حساب</span><small>رمز عبور و ورود</small><b aria-hidden="true">←</b></Link>
          <Link className="profile-action" href="/profile/exams"><span>تاریخچهٔ آزمون‌ها</span><small>نتایج و تلاش‌ها</small><b aria-hidden="true">←</b></Link>
        </nav>
      </section>
    </main>
  );
}
