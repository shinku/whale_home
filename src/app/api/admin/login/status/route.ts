import { NextRequest, NextResponse } from "next/server";

import {
  adminCookieIsSecure,
  getAdminSessionCookieName,
  pollAdminLoginScene,
} from "@/lib/admin-login";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request: NextRequest) {
  const scene = request.nextUrl.searchParams.get("scene")?.trim();
  if (!scene) {
    return NextResponse.json(
      { state: "not_found", message: "scene is required" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const status = await pollAdminLoginScene(scene);
    if (
      status.state !== "ready" ||
      !status.token ||
      !status.openid ||
      !status.expires_time
    ) {
      return NextResponse.json(status, { headers: noStoreHeaders });
    }

    const expiresAt = new Date(status.expires_time).getTime();
    const maxAge = Number.isFinite(expiresAt)
      ? Math.max(1, Math.floor((expiresAt - Date.now()) / 1000))
      : 60;
    const response = NextResponse.json(
      {
        state: "ready",
        openid: status.openid,
        expires_time: status.expires_time,
      },
      { headers: noStoreHeaders },
    );
    response.cookies.set(getAdminSessionCookieName(), status.token, {
      httpOnly: true,
      secure: adminCookieIsSecure(),
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        state: "error",
        message: error instanceof Error ? error.message : "轮询失败",
      },
      { status: 502, headers: noStoreHeaders },
    );
  }
}
