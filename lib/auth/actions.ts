"use server";

import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth, signOut } from "@/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema, normalizeEmail, normalizeUsername, profileSchema, signupSchema } from "@/lib/auth/schemas";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type ActionResult = { ok: true } | { ok: false; code: string; message: string };

export async function registerUser(input: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "اطلاعات ثبت‌نام معتبر نیست." };
  const rate = await consumeRateLimit(`signup:${parsed.data.email}`, 5, 60 * 60 * 1_000);
  if (rate.provider === "unavailable") {
    return { ok: false, code: "RATE_LIMIT_UNAVAILABLE", message: "ثبت‌نام موقتاً در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید." };
  }
  if (!rate.allowed) return { ok: false, code: "RATE_LIMITED", message: "تلاش‌های ثبت‌نام بیش از حد است. کمی بعد دوباره امتحان کنید." };

  const db = getDb();
  const existing = await db.select({ id: users.id }).from(users).where(or(
    eq(users.usernameNormalized, parsed.data.username),
    eq(users.email, parsed.data.email)
  )).limit(1);
  if (existing.length) return { ok: false, code: "CONFLICT", message: "این نام کاربری یا ایمیل در دسترس نیست." };

  await db.insert(users).values({
    username: parsed.data.username,
    usernameNormalized: parsed.data.username,
    email: parsed.data.email,
    name: parsed.data.displayName || parsed.data.username,
    displayName: parsed.data.displayName || null,
    passwordHash: await hashPassword(parsed.data.password),
    role: "USER",
    status: "ACTIVE"
  });
  return { ok: true };
}

export async function updateOwnProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "اطلاعات پروفایل معتبر نیست." };
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: "AUTH_REQUIRED", message: "برای ادامه وارد شوید." };
  await getDb().update(users).set({
    name: parsed.data.displayName,
    displayName: parsed.data.displayName,
    bio: parsed.data.bio || null,
    preferredLocale: parsed.data.preferredLocale,
    timezone: parsed.data.timezone || null,
    updatedAt: new Date()
  }).where(eq(users.id, session.user.id));
  revalidatePath("/profile");
  return { ok: true };
}

export async function changeOwnPassword(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "رمز عبور معتبر نیست." };
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: "AUTH_REQUIRED", message: "برای ادامه وارد شوید." };
  const db = getDb();
  const user = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, session.user.id)).limit(1).then((rows) => rows[0]);
  if (!user?.passwordHash || !await verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return { ok: false, code: "FORBIDDEN", message: "رمز عبور فعلی درست نیست." };
  }
  await db.transaction(async (transaction) => {
    await transaction.update(users).set({ passwordHash: await hashPassword(parsed.data.newPassword), updatedAt: new Date() }).where(eq(users.id, session.user.id));
    await transaction.delete(sessions).where(eq(sessions.userId, session.user.id));
  });
  return { ok: true };
}

export async function requestOwnAccountDeletion(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: "AUTH_REQUIRED", message: "برای ادامه وارد شوید." };
  const db = getDb();
  await db.transaction(async (transaction) => {
    await transaction.update(users).set({
      status: "DELETED",
      deletedAt: new Date(),
      email: `deleted-${session.user.id}@invalid.local`,
      username: null,
      usernameNormalized: null,
      name: null,
      displayName: null,
      bio: null,
      image: null,
      passwordHash: null,
      updatedAt: new Date()
    }).where(eq(users.id, session.user.id));
    await transaction.delete(sessions).where(eq(sessions.userId, session.user.id));
  });
  await signOut({ redirectTo: "/" });
  return { ok: true };
}

export { normalizeEmail, normalizeUsername };
