import { NextRequest, NextResponse } from "next/server";

import {
  adminCookieIsSecure,
  getAdminSessionCookieName,
} from "@/lib/admin-login-config";

export function middleware(request: NextRequest) {
  const isAdminPath =
    request.nextUrl.pathname === "/ddadmin" ||
    request.nextUrl.pathname.startsWith("/ddadmin/");
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (isAdminPath && token) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete("token");
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.cookies.set(getAdminSessionCookieName(), token, {
      httpOnly: true,
      secure: adminCookieIsSecure(),
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}
