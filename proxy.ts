import { NextResponse } from "next/server";

import { auth } from "@/auth";

const accountPaths = ["/profile", "/attempts"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;
  const needsAccount = accountPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const needsAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (needsAccount && !session?.user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (needsAdmin && !["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "")) {
    return NextResponse.redirect(new URL(session?.user ? "/" : "/login", request.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/profile/:path*", "/attempts/:path*", "/admin/:path*"]
};
