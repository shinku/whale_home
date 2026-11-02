import { NextRequest, NextResponse } from "next/server";

import { getApiHost } from "@/utils";

export const dynamic = "force-dynamic";

/**
 * AI 学习助手 SSE 代理。
 *
 * 通用代理会先读取完整文本再返回，不适用于 SSE；这里直接把上游
 * ReadableStream 交给响应，并关闭常见的反向代理缓冲，保证逐段到达浏览器。
 */
export async function POST(request: NextRequest) {
  const userId =
    request.headers.get("x-openid")?.trim() ||
    request.headers.get("x-user-id")?.trim() ||
    "";
  const lane = request.headers.get("x-lane")?.trim() || "whale";
  const body = await request.arrayBuffer();

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    "x-lane": lane,
  });
  if (userId) headers.set("x-user-id", userId);

  try {
    const upstream = await fetch(`${getApiHost()}api/ai/agent/chat`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      signal: request.signal,
    });

    const responseHeaders = new Headers({
      "Content-Type":
        upstream.headers.get("Content-Type") ||
        "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error proxying learning agent chat:", error);
    return NextResponse.json(
      { status: 500, message: "学习助手连接失败，请稍后重试" },
      { status: 500 },
    );
  }
}
