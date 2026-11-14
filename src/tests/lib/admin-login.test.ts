import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  adminCookieIsSecure,
  checkAdminPermission,
  createAdminLoginCode,
  exchangeAdminToken,
  getAdminSessionCookieName,
  pollAdminLoginScene,
} from "@/lib/admin-login";
import {
  HOST,
  jsonResponse,
  restoreFetch,
  stubFetch,
} from "@/tests/helpers/proxy";

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("admin login service", () => {
  it("使用固定 cookie 名称", () => {
    expect(getAdminSessionCookieName()).toBe("admin_login_token");
    expect(typeof adminCookieIsSecure()).toBe("boolean");
  });

  it("创建小程序码时发送 scene 和登录页路径", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        status: 200,
        data: {
          scene: "scene-1",
          page: "pages/welcome/welcome",
          image: "data:image/png;base64,abc",
          expires_time: "2026-11-15T10:00:00.000Z",
        },
      }),
    );

    const result = await createAdminLoginCode("scene-1");

    expect(result.scene).toBe("scene-1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HOST}api/admin/getwxacodeunlimit`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      scene: "scene-1",
      page: "pages/welcome/welcome",
    });
  });

  it("轮询登录状态时编码 scene", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        status: 200,
        data: { state: "pending", scene: "a b" },
      }),
    );

    await pollAdminLoginScene("a b");

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${HOST}api/admin/login/status?scene=a%20b`,
    );
  });

  it("使用 token 换取 openid", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        status: 200,
        data: {
          openid: "openid-1",
          expires_time: "2026-11-15T10:00:00.000Z",
        },
      }),
    );

    await expect(exchangeAdminToken("token-1")).resolves.toMatchObject({
      openid: "openid-1",
    });
    expect(fetchMock.mock.calls[0][0]).toBe(`${HOST}api/admin/openid`);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      token: "token-1",
    });
  });

  it("使用 openid 和 operator 查询后台权限", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        status: 200,
        data: { authorized: true },
      }),
    );

    await expect(checkAdminPermission("openid-1")).resolves.toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${HOST}admin/user_lisence?user_id=openid-1&admin_type=operator`,
    );
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("x-user-id"),
    ).toBe("openid-1");
  });
});
