import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { POST } from "@/app/api/ai/agent/chat/route";
import {
  HOST,
  makeRequest,
  restoreFetch,
  stubFetch,
  stubFetchReject,
} from "@/tests/helpers/proxy";

const encoder = new TextEncoder();

const sseResponse = (body: string, status = 200) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(body));
        controller.close();
      },
    }),
    {
      status,
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    },
  );

const makeChatRequest = (
  payload: unknown = { message: "你好" },
  headers: Record<string, string> = {},
) =>
  makeRequest("/api/ai/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("POST /api/ai/agent/chat", () => {
  it("流式转发请求，并使用 x-openid 作为上游 x-user-id", async () => {
    const payload =
      'event: answer\ndata: {"type":"answer","content":"答案"}\n\n';
    const fetchMock = stubFetch(sseResponse(payload));

    const response = await POST(
      makeChatRequest(undefined, {
        "x-openid": "openid-from-gateway",
        "x-lane": "whale-vip",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/event-stream; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-transform",
    );
    expect(response.headers.get("X-Accel-Buffering")).toBe("no");
    expect(await response.text()).toBe(payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HOST}api/ai/agent/chat`);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Accept")).toBe("text/event-stream");
    expect(new Headers(init?.headers).get("x-user-id")).toBe(
      "openid-from-gateway",
    );
    expect(new Headers(init?.headers).get("x-lane")).toBe("whale-vip");
    expect(
      JSON.parse(new TextDecoder().decode(init?.body as ArrayBuffer)),
    ).toEqual({ message: "你好" });
  });

  it("默认使用 whale lane，并优先采用可信网关注入的 x-openid", async () => {
    const fetchMock = stubFetch(sseResponse("event: done\ndata: {}\n\n"));

    await POST(
      makeChatRequest(undefined, {
        "x-user-id": "user-1",
        "x-openid": "openid-1",
      }),
    );

    const forwarded = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(forwarded.get("x-user-id")).toBe("openid-1");
    expect(forwarded.get("x-lane")).toBe("whale");
  });

  it("原样转发聊天请求中的 imageBase64", async () => {
    const fetchMock = stubFetch(sseResponse("event: done\ndata: {}\n\n"));
    const imageBase64 = "data:image/jpeg;base64,aW1hZ2U=";

    await POST(
      makeChatRequest({
        message: "分析图片",
        conversationId: "conversation-1",
        imageBase64,
      }),
    );

    const body = JSON.parse(
      new TextDecoder().decode(fetchMock.mock.calls[0][1]?.body as ArrayBuffer),
    );
    expect(body).toEqual({
      message: "分析图片",
      conversationId: "conversation-1",
      imageBase64,
    });
  });

  it("上游非流式错误响应保持状态码和 JSON 内容", async () => {
    stubFetch(
      new Response(JSON.stringify({ status: 401, message: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await POST(makeChatRequest());

    expect(response.status).toBe(401);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(await response.json()).toEqual({ status: 401, message: "请先登录" });
  });

  it("上游连接异常时返回统一 JSON 错误", async () => {
    stubFetchReject(new Error("boom"));

    const response = await POST(makeChatRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      status: 500,
      message: "学习助手连接失败，请稍后重试",
    });
  });
});
