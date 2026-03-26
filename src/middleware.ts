import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to protect /admin/* routes.
 * Uses JWT token check from next-auth cookie.
 * Does NOT import the full auth config to avoid triggering DB connection at build time.
 */
export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute) {
    // Check for next-auth session token (JWT strategy)
    const token =
      request.cookies.get("__Secure-next-auth.session-token") ??
      request.cookies.get("next-auth.session-token");

    if (!token) {
      const signInUrl = new URL("/api/auth/signin", request.nextUrl.origin);
      signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
