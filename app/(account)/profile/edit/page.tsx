import Link from "next/link";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const profile = await getDb().select({ displayName: users.displayName, bio: users.bio, preferredLocale: users.preferredLocale, timezone: users.timezone }).from(users).where(eq(users.id, session.user.id)).limit(1).then((rows) => rows[0]);
  if (!profile) return null;
  return <main id="main-content" className="account-page page-shell"><section className="account-card" aria-labelledby="edit-profile-title"><Link className="account-back-link" href="/profile"><span aria-hidden="true">→</span> بازگشت به پروفایل</Link><h1 id="edit-profile-title">ویرایش پروفایل</h1><ProfileForm profile={{ ...profile, displayName: profile.displayName ?? session.user.username, preferredLocale: profile.preferredLocale as "fa" | "en" }} /></section></main>;
}
