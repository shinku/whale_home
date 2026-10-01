import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { handleRequest } from "@/app/api/admin/[...slug]/route";
import {
  HOST,
  contextFor,
  jsonResponse,
  makeRequest,
  restoreFetch,
  stubFetch,
  utilsMock,
  withLocalUpstream,
} from "@/tests/helpers/proxy";

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("admin 代理 - 目标地址", () => {
  it("转发到 getApiHost() + 'admin/' + slug", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    await handleRequest(
      makeRequest("/api/admin/summary/users"),
      contextFor("summary", "users"),
    );

    expect(fetchMock.mock.calls[0][0]).toBe(`${HOST}admin/summary/users`);
  });

  it("保留 query string", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    await handleRequest(
      makeRequest("/api/admin/summary/users?offset=0&limit=20"),
      contextFor("summary", "users"),
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${HOST}admin/summary/users?offset=0&limit=20`,
    );
  });

  it("admin 走默认 getApiHost()（不指定 env）", async () => {
    stubFetch(jsonResponse({ ok: true }));
    const originalGetApiHost = utilsMock.getApiHost;
    const envs: (string | undefined)[] = [];
    utilsMock.getApiHost = (env) => {
      envs.push(env);
      return originalGetApiHost(env);
    };

    try {
      await handleRequest(
        makeRequest("/api/admin/summary/users"),
        contextFor("summary", "users"),
      );
    } finally {
      utilsMock.getApiHost = originalGetApiHost;
    }

    expect(envs).toEqual([undefined]);
  });
});

describe("admin 代理 - 请求头与 body", () => {
  it("只转发白名单里的头（x-user-id / Authorization / Content-Type）", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    await handleRequest(
      makeRequest("/api/admin/summary/users", {
        method: "POST",
        body: JSON.stringify({ a: 1 }),
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-123",
          Authorization: "Bearer token",
          connection: "upgrade",
          cookie: "session=secret",
        },
      }),
      contextFor("summary", "users"),
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const forwarded = init.headers as Headers;
    expect(forwarded.get("x-user-id")).toBe("user-123");
    expect(forwarded.get("authorization")).toBe("Bearer token");
    expect(forwarded.get("content-type")).toBe("application/json");
    expect(forwarded.has("connection")).toBe(false);
    expect(forwarded.has("cookie")).toBe(false);
  });

  it("GET 不转发 body，POST 原样透传 body 字节", async () => {
    const getMock = stubFetch(jsonResponse({ ok: true }));
    await handleRequest(
      makeRequest("/api/admin/summary/users"),
      contextFor("summary", "users"),
    );
    expect(getMock.mock.calls[0][1]?.body).toBeUndefined();

    const payload = JSON.stringify({ name: "whale" });
    const postMock = stubFetch(jsonResponse({ ok: true }));
    await handleRequest(
      makeRequest("/api/admin/banner", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      contextFor("banner"),
    );

    const init = postMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(payload);
  });
});

describe("admin 代理 - 响应回传", () => {
  it("上游非 2xx 时原样回传状态码与 body", async () => {
    stubFetch(
      new Response(JSON.stringify({ message: "not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await handleRequest(
      makeRequest("/api/admin/missing"),
      contextFor("missing"),
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "not found" });
  });

  it("204 等不允许带 body 的状态不会误报 500", async () => {
    stubFetch(new Response(null, { status: 204 }));

    const res = await handleRequest(
      makeRequest("/api/admin/banner", { method: "DELETE" }),
      contextFor("banner"),
    );

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });
});

describe("admin 代理 - 方法与异常", () => {
  it("不支持的方法返回 405，且不请求上游", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    const res = await handleRequest(
      makeRequest("/api/admin/banner", { method: "PATCH" }),
      contextFor("banner"),
    );

    expect(res.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("真实转发：带 Connection: upgrade 的请求不会被 undici 拒绝", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    await withLocalUpstream(async ({ seen }) => {
      const request = makeRequest("/api/admin/banner", {
        headers: { connection: "upgrade", upgrade: "websocket" },
      });

      const res = await handleRequest(request, contextFor("banner"));

      expect(res.status).toBe(200);
      expect(seen().upgrade).toBeUndefined();
      expect(seen().connection).not.toBe("upgrade");
    });
  });
});
