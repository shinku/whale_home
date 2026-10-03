import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";

import { handleRequest } from "@/app/api/[...slug]/route";
import { lisencedPaths } from "@/app/api/[...slug]/lisence";
import {
  HOST,
  contextFor,
  jsonResponse,
  makeRequest,
  restoreFetch,
  stubFetch,
  stubFetchReject,
  utilsMock,
  withLocalUpstream,
} from "@/tests/helpers/proxy";

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("handleRequest - lisencedPaths 白名单", () => {
  it("白名单里包含 edu（默认放行 /api/edu/*）", () => {
    expect(lisencedPaths).toContain("edu");
  });

  it("首段不在白名单时返回 403，且不请求后端", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    const res = await handleRequest(
      makeRequest("/api/secret/data"),
      contextFor("secret", "data"),
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Unauthorized path" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["secret", "admin", "lisence", "internal"])(
    "未授权的首段 %s 一律返回 403",
    async (segment) => {
      if (lisencedPaths.includes(segment)) return; // 配置里放行的跳过

      const fetchMock = stubFetch(jsonResponse({ ok: true }));
      const res = await handleRequest(
        makeRequest(`/api/${segment}/x`),
        contextFor(segment, "x"),
      );

      expect(res.status).toBe(403);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("只判断首段：/api/edu/任意/更深 都放行", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    const res = await handleRequest(
      makeRequest("/api/edu/deep/nested/path"),
      contextFor("edu", "deep", "nested", "path"),
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`${HOST}api/edu/deep/nested/path`);
  });

  it("白名单校验发生在读取 body / 转发 之前（未授权 POST 不读 body）", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));
    const arrayBuffer = jest.fn(async () => new ArrayBuffer(0));
    const request = {
      method: "POST",
      nextUrl: new URL("http://localhost/api/secret"),
      headers: new Headers(),
      arrayBuffer,
    } as unknown as NextRequest;

    const res = await handleRequest(request, contextFor("secret"));

    expect(res.status).toBe(403);
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("handleRequest - 目标地址拼接", () => {
  it("转发到 getApiHost() + 'api/' + slug", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: [] }));

    await handleRequest(
      makeRequest("/api/edu/news"),
      contextFor("edu", "news"),
    );

    expect(fetchMock.mock.calls[0][0]).toBe(`${HOST}api/edu/news`);
  });

  it("保留 query string", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: [] }));

    await handleRequest(
      makeRequest("/api/edu/news?offset=0&limit=2"),
      contextFor("edu", "news"),
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${HOST}api/edu/news?offset=0&limit=2`,
    );
  });

  it("没有 query string 时不追加 '?'", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    await handleRequest(
      makeRequest("/api/edu/news"),
      contextFor("edu", "news"),
    );

    expect(fetchMock.mock.calls[0][0]).not.toContain("?");
  });

  it("上游 host 用默认的 getApiHost()（与 admin 一致，按 NODE_ENV 走）", async () => {
    stubFetch(jsonResponse({ ok: true }));
    const originalGetApiHost = utilsMock.getApiHost;
    const envs: (string | undefined)[] = [];
    utilsMock.getApiHost = (env) => {
      envs.push(env);
      return originalGetApiHost(env);
    };

    try {
      await handleRequest(
        makeRequest("/api/edu/news"),
        contextFor("edu", "news"),
      );
    } finally {
      utilsMock.getApiHost = originalGetApiHost;
    }

    expect(envs).toEqual([undefined]);
  });
});

describe("handleRequest - 请求转发", () => {
  it("转发 method，并对 GET/HEAD 不发送 body", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    await handleRequest(
      makeRequest("/api/edu/news"),
      contextFor("edu", "news"),
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it("转发 POST 的 body 与 content-type", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));
    const payload = JSON.stringify({ hello: "world" });

    const request = makeRequest("/api/edu/news", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-123",
      },
      body: payload,
    });

    await handleRequest(request, contextFor("edu", "news"));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(payload);

    // proxyToApi 现在按 admin 的做法自己拼头：Content-Type + x-user-id
    const forwarded = init.headers as Record<string, string>;
    expect(forwarded["Content-Type"]).toBe("application/json");
    expect(forwarded["x-user-id"]).toBe("user-123");
  });

  it("不会把 host / content-length 透传给上游", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    await handleRequest(
      makeRequest("/api/edu/news", {
        method: "POST",
        body: JSON.stringify({ a: 1 }),
      }),
      contextFor("edu", "news"),
    );

    const forwarded = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(forwarded).not.toHaveProperty("host");
    expect(forwarded).not.toHaveProperty("content-length");
  });
});

describe("handleRequest - 只转发 admin 风格的固定头", () => {
  // 线上报错：TypeError: fetch failed / InvalidArgumentError: invalid connection header
  // 原因：nginx 用 proxy_set_header Connection 'upgrade' 注入连接头，
  // 老写法把客户端请求头原样透传给 undici，undici 只接受 'close' / 'keep-alive'。
  // 现在由 src/utils/proxy.ts 自己拼头（Content-Type + x-user-id），
  // 客户端的其余头一律不透传。
  const HOP_BY_HOP = [
    "connection",
    "keep-alive",
    "proxy-connection",
    "transfer-encoding",
    "upgrade",
    "te",
    "trailer",
    "expect",
  ];

  it.each(HOP_BY_HOP)("逐跳头 %s 不会被转发", async (name) => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    const request = makeRequest("/api/edu/news", {
      headers: {
        [name]: "upgrade",
        "content-type": "application/json",
      },
    });

    await handleRequest(request, contextFor("edu", "news"));

    const forwarded = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(forwarded).not.toHaveProperty(name);
    expect(forwarded["Content-Type"]).toBe("application/json");
  });

  it("只带上 x-user-id，不转发 Authorization", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    const request = makeRequest("/api/edu/news", {
      headers: {
        Authorization: "Bearer token",
        "x-user-id": "user-123",
        "content-type": "application/json",
      },
    });

    await handleRequest(request, contextFor("edu", "news"));

    const forwarded = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(forwarded["x-user-id"]).toBe("user-123");
    expect(forwarded).not.toHaveProperty("authorization");
    expect(forwarded).not.toHaveProperty("Authorization");
  });

  it("客户端的其他头不会被转发（cookie / sec-* / 自定义头等）", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    const request = makeRequest("/api/edu/news", {
      headers: {
        cookie: "session=secret",
        "x-custom": "keep-me",
        "sec-fetch-mode": "cors",
      },
    });

    await handleRequest(request, contextFor("edu", "news"));

    const forwarded = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(forwarded).not.toHaveProperty("cookie");
    expect(forwarded).not.toHaveProperty("x-custom");
    expect(forwarded).not.toHaveProperty("sec-fetch-mode");
  });

  it("真实转发：带 Upgrade / Keep-Alive 的请求不会被 undici 拒绝", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});

    await withLocalUpstream(async ({ seen }) => {
      const request = makeRequest("/api/edu/news?limit=10", {
        headers: {
          connection: "upgrade",
          upgrade: "websocket",
          "keep-alive": "timeout=5",
        },
      });

      const res = await handleRequest(request, contextFor("edu", "news"));

      expect(res.status).toBe(200);
      const upstreamHeaders = seen();
      expect(upstreamHeaders.upgrade).toBeUndefined();
      expect(upstreamHeaders["keep-alive"]).toBeUndefined();
      expect(upstreamHeaders.connection).not.toBe("upgrade");
    });
  });

  it("真实转发：Connection 为空值（nginx proxy_set_header Connection ''）也不会 500", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    await withLocalUpstream(async ({ seen }) => {
      const request = makeRequest("/api/edu/news", {
        headers: { connection: "" },
      });

      const res = await handleRequest(request, contextFor("edu", "news"));

      expect(res.status).toBe(200);
      expect(seen().connection).not.toBe("");
    });
  });
});

describe("handleRequest - 响应回传", () => {
  it("原样回传上游 status / content-type / body", async () => {
    stubFetch(
      new Response("plain text body", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    const res = await handleRequest(
      makeRequest("/api/edu/missing"),
      contextFor("edu", "missing"),
    );

    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
    expect(await res.text()).toBe("plain text body");
  });

  it("204 等不允许带 body 的状态原样回传，不会误报 500", async () => {
    stubFetch(new Response(null, { status: 204 }));

    const res = await handleRequest(
      makeRequest("/api/edu/empty"),
      contextFor("edu", "empty"),
    );

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("上游没有 content-type 时回退为 application/json", async () => {
    stubFetch(new Response(null, { status: 200 }));

    const res = await handleRequest(
      makeRequest("/api/edu/empty"),
      contextFor("edu", "empty"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });
});

describe("handleRequest - 异常处理", () => {
  it("fetch 抛错时返回 500", async () => {
    stubFetchReject(new Error("network down"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await handleRequest(
      makeRequest("/api/edu/news"),
      contextFor("edu", "news"),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal Server Error" });
  });

  it("读取 body 失败时返回 400（且不转发）", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const request = {
      method: "POST",
      nextUrl: new URL("http://localhost/api/edu/news"),
      headers: new Headers(),
      arrayBuffer: async () => {
        throw new Error("body read failed");
      },
    } as unknown as NextRequest;

    const res = await handleRequest(request, contextFor("edu", "news"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Failed to read request body" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
