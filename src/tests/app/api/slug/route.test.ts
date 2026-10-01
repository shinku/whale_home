import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

import { handleRequest } from "@/app/api/[...slug]/route";
import { lisencedPaths } from "@/app/api/[...slug]/lisence";

// getApiHost 已在 src/tests/setup.ts 里被固定替换（见 jest.config.js 的 setupFiles）
const HOST = "https://api.example.test/";

// 保存原始 fetch，测试结束后还原（Jest 没有 stubGlobal，手动替换全局即可）
const originalFetch = globalThis.fetch;

type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];
type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/** 构造一个真实的 NextRequest（只用到 nextUrl / method / headers / arrayBuffer） */
function makeRequest(path: string, init?: NextRequestInit) {
  return new NextRequest(new URL(path, "http://localhost"), init);
}

/** route handler 的第二个参数：{ params: Promise<{ slug: string[] }> } */
function contextFor(...segments: string[]) {
  return { params: Promise.resolve({ slug: segments }) };
}

/** 把全局 fetch 替换成始终返回给定 Response 的 mock */
function stubFetch(response: Response) {
  const fetchMock = jest.fn<FetchFn>().mockResolvedValue(response);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** 把全局 fetch 替换成必定失败的 mock */
function stubFetchReject(error: Error) {
  const fetchMock = jest.fn<FetchFn>().mockRejectedValue(error);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
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

    await handleRequest(makeRequest("/api/edu/news"), contextFor("edu", "news"));

    expect(fetchMock.mock.calls[0][0]).not.toContain("?");
  });
});

describe("handleRequest - 请求转发", () => {
  it("转发 method，并对 GET/HEAD 不发送 body", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    await handleRequest(makeRequest("/api/edu/news"), contextFor("edu", "news"));
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET" });
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it("转发 POST 的 body 与自定义 header", async () => {
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

    const forwarded = init.headers as Headers;
    expect(forwarded.get("x-user-id")).toBe("user-123");
    expect(forwarded.get("content-type")).toBe("application/json");
  });

  it("剔除会干扰上游的 host 与 content-length 头", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }));

    await handleRequest(
      makeRequest("/api/edu/news", {
        method: "POST",
        body: JSON.stringify({ a: 1 }),
      }),
      contextFor("edu", "news"),
    );

    const forwarded = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(forwarded.has("host")).toBe(false);
    expect(forwarded.has("content-length")).toBe(false);
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
