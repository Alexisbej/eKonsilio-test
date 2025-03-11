import { AUTH_COOKIE_NAME, ROUTES } from "@/lib/constants";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPaths = [ROUTES.HOME, ROUTES.DASHBOARD];

const authPaths = [ROUTES.LOGIN];

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const path = request.nextUrl.pathname;

  const isProtectedPath = protectedPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  const isAuthPath = authPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (isProtectedPath && !authToken) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set(
      "redirect",
      encodeURIComponent(request.nextUrl.pathname),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && authToken) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
