import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/cart",
  "/checkout",
  "/orders",
  "/wallet",
  "/profile",
  "/dashboard",
  "/chat",
  "/notifications",
  "/my",
];

const ADMIN_ROUTES = ["/admin"];

const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We use localStorage for tokens (client-side only), so we can't check
  // auth in middleware directly. Instead, we rely on client-side guards.
  // However, we can check a cookie set during login for SSR protection.
  const hasAuthCookie = request.cookies.has("carnest_auth");

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Do NOT redirect away from /login or /register based solely on a cookie —
  // the cookie can be stale (token expired, logged out on another tab, etc.).
  // Client-side auth context handles redirecting already-authenticated users.

  // For protected routes without auth cookie — let client handle redirect
  // (client-side AuthGuard will redirect to /login)
  if ((isProtected || isAdmin) && !hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)",
  ],
};
