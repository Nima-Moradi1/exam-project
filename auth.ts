import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";

import { credentialsSchema } from "@/lib/auth/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getServerEnvironment, requireAuthSecret } from "@/lib/env/server";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const environment = getServerEnvironment();
  const providers: Provider[] = [
    Credentials({
      name: "Username and password",
      credentials: {
        username: { label: "نام کاربری", type: "text" },
        password: { label: "رمز عبور", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const db = getDb();
        const user = await db.select().from(users)
          .where(eq(users.usernameNormalized, parsed.data.username))
          .limit(1)
          .then((rows) => rows[0]);

        if (!user?.passwordHash || user.status !== "ACTIVE" || user.deletedAt) return null;
        if (!await verifyPassword(parsed.data.password, user.passwordHash)) return null;

        await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
        return {
          id: user.id,
          name: user.name ?? user.displayName ?? user.username,
          email: user.email,
          image: user.image,
          username: user.username ?? "",
          displayName: user.displayName,
          role: user.role,
          status: user.status
        };
      }
    })
  ];

  if (environment.AUTH_GOOGLE_ID && environment.AUTH_GOOGLE_SECRET) {
    providers.push(Google({
      clientId: environment.AUTH_GOOGLE_ID,
      clientSecret: environment.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false
    }));
  }

  return {
    adapter: DrizzleAdapter(getDb()),
    secret: requireAuthSecret(),
    session: { strategy: "database" },
    providers,
    pages: {
      signIn: "/login",
      error: "/auth-error"
    },
    callbacks: {
      async session({ session, user }) {
        session.user.id = user.id;
        session.user.username = user.username ?? "";
        session.user.displayName = user.displayName ?? null;
        session.user.role = user.role ?? "USER";
        session.user.status = user.status ?? "ACTIVE";
        return session;
      }
    }
  };
});
