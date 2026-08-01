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
    session: { strategy: "jwt" },
    providers,
    pages: {
      signIn: "/login",
      error: "/auth-error"
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.username = user.username ?? "";
          token.displayName = user.displayName ?? null;
          token.role = user.role ?? "USER";
          token.status = user.status ?? "ACTIVE";
        }
        return token;
      },
      async session({ session, token }) {
        const userToken = token as typeof token & {
          id?: string;
          username?: string;
          displayName?: string | null;
          role?: "USER" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";
          status?: "ACTIVE" | "SUSPENDED" | "DELETED";
        };
        session.user.id = userToken.id || token.sub || "";
        session.user.username = userToken.username ?? "";
        session.user.displayName = userToken.displayName ?? null;
        session.user.role = userToken.role ?? "USER";
        session.user.status = userToken.status ?? "ACTIVE";
        return session;
      }
    }
  };
});
