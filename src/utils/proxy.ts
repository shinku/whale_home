import { NextRequest, NextResponse } from "next/server";

import { getApiHost } from "@/utils";

/**
 * 允许转发给上游的请求头白名单（大小写不敏感）。
 *
 * 公共接口不需要认证信息，所以这里不含 Authorization / x-user-id：
 * 需要带认证的具名路由（如 src/app/api/admin/[...slug]/route.ts）自己拼头。
 *
 * 这里用「白名单」而不是「黑名单」：客户端和 nginx 会带一堆与本请求无关的头
 * （Connection / Upgrade / Keep-Alive / Host / Cookie / sec-* 等），
 * 透传给 Node 的 fetch（undici）会直接抛错，例如
 * `InvalidArgumentError: invalid connection header`（nginx 的
 * `proxy_set_header Connection 'upgrade'` 就会触发），最终表现为线上 500。
 * 需要新增可透传的头时，在这里加一项并补测试。
 */
export const FORWARDABLE_REQUEST_HEADERS = ["content-type"] as const;

/** 上游不带 body 的状态码，直接构造空响应，避免 Response 构造抛错 */
const BODY_LESS_STATUS = new Set([204, 205, 304]);

export type TApiHostEnv = "development" | "test" | "production";

export type TProxyOptions = {
  /** 上游路径（相对 API 根目录，允许带前导 /），如 "api/edu/news"、"admin/banner" */
  path: string;
  /** 上游环境，默认按 NODE_ENV 走 getApiHost() */
  hostEnv?: TApiHostEnv;
  /** 覆盖 query string，默认透传当前请求的 query */
  search?: URLSearchParams | string | null;
  /** 额外转发或覆盖的请求头 */
  headers?: Record<string, string>;
};

/** 拼接上游地址：getApiHost() 自带结尾斜杠，path 的前导斜杠会被去掉，避免双斜杠 */
export const buildUpstreamUrl = (
  path: string,
  search?: URLSearchParams | string | null,
  hostEnv?: TApiHostEnv,
) => {
  const url = getApiHost(hostEnv) + path.replace(/^\/+/, "");
  const query =
    typeof search === "string" ? search : (search?.toString() ?? "");
  return query ? `${url}?${query}` : url;
};

/** 只挑白名单里的请求头转发，未列出的头一律丢弃 */
export const pickForwardHeaders = (
  request: NextRequest,
  extra?: Record<string, string>,
) => {
  const headers = new Headers();

  for (const name of FORWARDABLE_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  for (const [name, value] of Object.entries(extra ?? {})) {
    if (value) {
      headers.set(name, value);
    }
  }

  return headers;
};

/**
 * 通用代理：把当前请求转发到 getApiHost() + path，并原样回传上游状态码与 body。
 * GET / HEAD 不转发 body，其他方法直接透传原始字节（避免 JSON 二次序列化）。
 */
export const proxyToApi = async (
  request: NextRequest,
  { path, hostEnv, search, headers: extraHeaders }: TProxyOptions,
): Promise<NextResponse> => {
  const destination = buildUpstreamUrl(
    path,
    search ?? request.nextUrl.searchParams,
    hostEnv,
  );

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > 0) {
        body = buffer;
      }
    } catch (error) {
      console.error("Error reading request body:", error);
      return NextResponse.json(
        { error: "Failed to read request body" },
        { status: 400 },
      );
    }
  }

  try {
    const response = await fetch(destination, {
      method: request.method,
      headers: {
         'Content-Type': 'application/json',
          'x-user-id': request.headers.get('x-user-id') || "",
      },
      body,
      redirect: "manual",
      cache: "no-store",
    });

    if (BODY_LESS_STATUS.has(response.status)) {
      return new NextResponse(null, { status: response.status });
    }

    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Error proxying request:", { destination, error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
