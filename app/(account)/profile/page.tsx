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

  return (
    <main id="main-content" className="account-page page-shell">
      <section className="account-card" aria-labelledby="profile-title">
        <span className="eyebrow"><i /> حساب من</span>
        <h1 id="profile-title">{profile.displayName || profile.username}</h1>
        <dl className="profile-details">
          <div><dt>نام کاربری</dt><dd dir="ltr">{profile.username || "برای ورود با Google باید نام کاربری انتخاب کنید."}</dd></div>
          <div><dt>ایمیل</dt><dd dir="ltr">{profile.email}</dd></div>
          <div><dt>زبان ترجیحی</dt><dd>{profile.preferredLocale}</dd></div>
          {profile.bio && <div><dt>دربارهٔ من</dt><dd>{profile.bio}</dd></div>}
        </dl>
        <div className="account-actions"><Link className="primary-button" href="/profile/edit">ویرایش پروفایل</Link><Link className="secondary-button" href="/profile/security">امنیت حساب</Link><Link className="secondary-button" href="/profile/exams">تاریخچهٔ آزمون‌ها</Link></div>
      </section>
    </main>
  );
}
