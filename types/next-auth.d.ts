import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      displayName: string | null;
      role: "USER" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";
      status: "ACTIVE" | "SUSPENDED" | "DELETED";
    };
  }

  interface User {
    username: string;
    displayName: string | null;
    role: "USER" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";
    status: "ACTIVE" | "SUSPENDED" | "DELETED";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    displayName?: string | null;
    role?: "USER" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";
    status?: "ACTIVE" | "SUSPENDED" | "DELETED";
  }
}
