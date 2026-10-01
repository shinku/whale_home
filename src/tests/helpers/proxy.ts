import { jest } from "@jest/globals";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { NextRequest } from "next/server";

/** setup.ts 里把 getApiHost 固定成了这个地址（见 jest.config.js 的 setupFiles） */
export const HOST = "https://api.example.test/";

// setup.ts 是 factory mock，返回的是普通对象，测试里可以临时改写（用完必须还原）
export const utilsMock = jest.requireMock("@/utils") as {
  getApiHost: (env?: "development" | "test" | "production") => string;
};

// 保存原始 fetch，测试结束后还原（Jest 没有 stubGlobal，手动替换全局即可）
const originalFetch = globalThis.fetch;

export type NextRequestInit = ConstructorParameters<typeof NextRequest>[1];
export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/** 构造一个真实的 NextRequest（route handler 只用到 nextUrl / method / headers / arrayBuffer） */
export function makeRequest(path: string, init?: NextRequestInit) {
  return new NextRequest(new URL(path, "http://localhost"), init);
}

/** route handler 的第二个参数：{ params: Promise<{ slug: string[] }> } */
export function contextFor(...segments: string[]) {
  return { params: Promise.resolve({ slug: segments }) };
}

/** 把全局 fetch 替换成始终返回给定 Response 的 mock */
export function stubFetch(response: Response) {
  const fetchMock = jest.fn<FetchFn>().mockResolvedValue(response);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** 把全局 fetch 替换成必定失败的 mock */
export function stubFetchReject(error: Error) {
  const fetchMock = jest.fn<FetchFn>().mockRejectedValue(error);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** 还原被测试替换掉的全局 fetch */
export function restoreFetch() {
  globalThis.fetch = originalFetch;
}

/**
 * 起一个真实的本地上游 HTTP 服务，并把 getApiHost() 临时指向它。
 * 只有在「真实 fetch」下才会走到 undici 的请求头校验，
 * 所以复现线上的 InvalidArgumentError 必须用真实网络请求，不能用 mock fetch。
 */
export async function withLocalUpstream(
  run: (upstream: {
    seen: () => Record<string, string | string[] | undefined>;
  }) => Promise<void>,
) {
  let seenHeaders: Record<string, string | string[] | undefined> = {};

  const server = createServer((req, res) => {
    seenHeaders = req.headers;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: 200, data: { list: [] } }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  const originalGetApiHost = utilsMock.getApiHost;
  utilsMock.getApiHost = () => `http://127.0.0.1:${port}/`;

  try {
    await run({ seen: () => seenHeaders });
  } finally {
    utilsMock.getApiHost = originalGetApiHost;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
