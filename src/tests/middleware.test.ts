import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

import { middleware } from "@/middleware";

const makeRequest = (url: string) =>
  new NextRequest(new URL(url, "https://example.test"));

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ddadmin token middleware", () => {
  it("从 query 写入 HttpOnly token cookie 并移除 URL token", () => {
    const response = middleware(
      makeRequest("/ddadmin/banner?token=db-token&foo=bar"),
    );
    const cookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.test/ddadmin/banner?foo=bar",
    );
    expect(cookie).toContain("admin_login_token=db-token");
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
  });

  it("非 ddadmin 路径不处理 token", () => {
    const response = middleware(makeRequest("/subjects?token=db-token"));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("没有 token 时正常进入 ddadmin", () => {
    const response = middleware(makeRequest("/ddadmin"));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
