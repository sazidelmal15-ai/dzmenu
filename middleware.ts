import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIES } from "@/constants/cookies";
import {
  ADMIN_ROUTE_PREFIX,
  RESTAURANT_PROTECTED_PREFIXES,
  ROUTES,
} from "@/constants/routes";

/**
 * Extracts tenant subdomain from request host.
 * Supports:
 * - Localhost subdomains: salem.localhost:3000 -> "salem"
 * - Production subdomains: salem.dzmenu.com -> "salem"
 */
function getTenantSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  // Root localhost or IP
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  // Local development: *.localhost (e.g. salem.localhost)
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "").trim();
    if (sub && !["www", "app", "admin", "api"].includes(sub)) {
      return sub;
    }
    return null;
  }

  // Vercel preview/production domains: e.g. dzmenu.vercel.app
  if (hostname.endsWith(".vercel.app")) {
    const parts = hostname.split(".");
    // <app-name>.vercel.app (3 parts) is the ROOT domain, NOT a tenant subdomain!
    if (parts.length <= 3) {
      return null;
    }
    // <subdomain>.<app-name>.vercel.app (4 parts)
    const sub = parts[0].trim();
    if (sub && !["www", "app", "admin", "api"].includes(sub)) {
      return sub;
    }
    return null;
  }

  // Configured Root Domain (e.g. softscape.xyz or dzmenu.com)
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "softscape.xyz").toLowerCase().trim();
  if (rootDomain && (hostname === rootDomain || hostname === `www.${rootDomain}`)) {
    return null;
  }
  if (rootDomain && hostname.endsWith("." + rootDomain)) {
    const sub = hostname.replace("." + rootDomain, "").trim();
    if (sub && !["www", "app", "admin", "api"].includes(sub)) {
      return sub;
    }
    return null;
  }

  // Generic multi-part domains: sub.domain.com
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const sub = parts[0].trim();
    if (sub && !["www", "app", "admin", "api", "dzmenu"].includes(sub)) {
      return sub;
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const subdomain = getTenantSubdomain(host);

  // 1. SUBDOMAIN REWRITE FOR PUBLIC RESTAURANT MENUS
  // e.g. salem.localhost:3000/ -> rewrites internally to /m/salem
  if (subdomain && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/images")) {
    const url = request.nextUrl.clone();
    url.pathname = `/m/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 2. BLOCK AND REMOVE DIRECT ACCESS TO /m/[slug] COMPLETELY
  // Direct visits to /m/... without a subdomain return 404 Not Found
  if (!subdomain && (pathname === "/m" || pathname.startsWith("/m/"))) {
    return new NextResponse("404 Not Found", { status: 404 });
  }

  // 2. AUTHENTICATION PROTECTION (FOR ROOT DASHBOARD & ADMIN)
  const sessionCookie = request.cookies.get(COOKIES.SESSION_TOKEN);
  const isAuthenticated = Boolean(sessionCookie?.value);

  const isProtectedAdminRoute =
    pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(ADMIN_ROUTE_PREFIX + "/");
  const isProtectedRestaurantRoute = RESTAURANT_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if ((isProtectedAdminRoute || isProtectedRestaurantRoute) && !isAuthenticated) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svgs, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
