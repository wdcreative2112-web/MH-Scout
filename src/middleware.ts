import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "mhscout_session";
const LEGACY_COOKIE_NAME = "pramukaone_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard and its subroutes
  if (pathname.startsWith("/dashboard")) {
    const token =
      request.cookies.get(COOKIE_NAME)?.value ||
      request.cookies.get(LEGACY_COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Clone response headers to inject standard security headers
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (/uploads, /images, /vendor, /icons)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|uploads/|images/|vendor/|icons/).*)",
  ],
};
