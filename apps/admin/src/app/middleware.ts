// middleware.ts
import { AUTH_COOKIE_NAME, ROUTES } from "@/lib/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Paths that require authentication
const protectedPaths = [ROUTES.HOME, ROUTES.DASHBOARD];

// Paths that should redirect to dashboard if already authenticated
const authPaths = [ROUTES.LOGIN];

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const path = request.nextUrl.pathname;

  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  // Check if path should redirect when authenticated
  const isAuthPath = authPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  // If path requires auth and no token exists, redirect to login
  if (isProtectedPath && !authToken) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set(
      "redirect",
      encodeURIComponent(request.nextUrl.pathname),
    );
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to access auth paths
  if (isAuthPath && authToken) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect these paths
    "/dashboard/:path*",
    // Apply to auth paths
    "/login",
  ],
};
