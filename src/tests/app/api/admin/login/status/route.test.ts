import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { GET } from "@/app/api/admin/login/status/route";
import {
  jsonResponse,
  makeRequest,
  restoreFetch,
  stubFetch,
  stubFetchReject,
} from "@/tests/helpers/proxy";

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("GET /api/admin/login/status", () => {
  it("缺少 scene 返回 400，且不请求后端", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: {} }));

    const response = await GET(makeRequest("/api/admin/login/status"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      state: "not_found",
      message: "scene is required",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ready 时写入 HttpOnly token cookie，且响应不返回 token", async () => {
    const expiresTime = new Date(Date.now() + 60_000).toISOString();
    stubFetch(
      jsonResponse({
        status: 200,
        data: {
          state: "ready",
          scene: "scene-1",
          token: "backend-token",
          openid: "openid-1",
          expires_time: expiresTime,
        },
      }),
    );

    const response = await GET(
      makeRequest("/api/admin/login/status?scene=scene-1"),
    );
    const body = await response.json();
    const cookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(body).toEqual({
      state: "ready",
      openid: "openid-1",
      expires_time: expiresTime,
    });
    expect(body.token).toBeUndefined();
    expect(cookie).toContain("admin_login_token=backend-token");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
  });

  it("pending 时不写 cookie", async () => {
    stubFetch(
      jsonResponse({
        status: 200,
        data: { state: "pending", scene: "scene-1" },
      }),
    );

    const response = await GET(
      makeRequest("/api/admin/login/status?scene=scene-1"),
    );

    expect(await response.json()).toEqual({
      state: "pending",
      scene: "scene-1",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("后端失败返回 502", async () => {
    stubFetchReject(new Error("backend down"));

    const response = await GET(
      makeRequest("/api/admin/login/status?scene=scene-1"),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      state: "error",
      message: "backend down",
    });
  });
});
