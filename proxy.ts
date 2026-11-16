import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isMutation =
    Boolean(process.env.DATABASE_URL) &&
    pathname.startsWith("/api/orders") &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const isProtectedPage = pathname.startsWith("/settings");

  if ((isMutation || isProtectedPage) && !getSessionCookie(request)) {
    if (isMutation) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/orders/:path*", "/settings/:path*"],
};
