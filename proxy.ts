import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import { auth } from "@/auth";
import { CANONICAL_HOSTNAME, CANONICAL_ORIGIN } from "@/lib/config/app-url";

const accountPaths = ["/profile", "/attempts"];
const legacyHosts = new Set(["full-exam-website.vercel.app"]);

function getContentSecurityPolicy(nonce: string, enforceSecureTransport: boolean) {
  const development = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob: https://*.vercel-storage.com https://*.public.blob.vercel-storage.com",
    "connect-src 'self' https://*.neon.tech https://*.upstash.io https://*.vercel-storage.com",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    enforceSecureTransport ? "upgrade-insecure-requests" : ""
  ].filter(Boolean).join("; ");
}

function secure<T extends Response>(response: T, policy: string, enforceSecureTransport: boolean): T {
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), gyroscope=(), magnetometer=(), payment=(), usb=(), microphone=(self)");
  if (enforceSecureTransport) response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  if (legacyHosts.has(hostname)) {
    return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, CANONICAL_ORIGIN), 308);
  }
  if (process.env.VERCEL_ENV === "production" && hostname.endsWith(".vercel.app") && hostname !== CANONICAL_HOSTNAME) {
    return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, CANONICAL_ORIGIN), 308);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const enforceSecureTransport = process.env.VERCEL_ENV === "production" || hostname === CANONICAL_HOSTNAME;
  const policy = getContentSecurityPolicy(nonce, enforceSecureTransport);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const { pathname } = request.nextUrl;
  const protectedRoute = accountPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)) || pathname === "/admin" || pathname.startsWith("/admin/");

  if (!protectedRoute) return secure(NextResponse.next({ request: { headers: requestHeaders } }), policy, enforceSecureTransport);

  const handleProxy = await auth((authenticatedRequest) => {
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
    return NextResponse.next({ request: { headers: requestHeaders } });
  });
  const response = await handleProxy(request, event as never);
  return secure(response ?? NextResponse.next({ request: { headers: requestHeaders } }), policy, enforceSecureTransport);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|fonts/|icon.svg|favicon.ico).*)"]
};
