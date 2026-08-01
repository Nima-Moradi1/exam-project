import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import { auth } from "@/auth";

const accountPaths = ["/profile", "/attempts"];

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // The Auth.js configuration is lazy, so its wrapper resolves asynchronously.
  // Resolve it per request before handing the request to the authenticated handler.
  const handleProxy = await auth((authenticatedRequest) => {
    const { pathname } = authenticatedRequest.nextUrl;
    const session = authenticatedRequest.auth;
    const needsAccount = accountPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    const needsAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

    if (needsAccount && !session?.user) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (needsAdmin && !["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role ?? "")) {
      if (!session?.user) {
        const url = new URL("/login", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  });
  return handleProxy(request, event as never);
}

export const config = {
  matcher: ["/profile/:path*", "/attempts/:path*", "/admin/:path*"]
};
