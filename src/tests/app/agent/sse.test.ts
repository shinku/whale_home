import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  parseAgentEventFrame,
  readAgentEventStream,
  streamAgentChat,
} from "@/app/agent/sse";
import type { TAgentEvent } from "@/app/agent/types";
import {
  restoreFetch,
  stubFetch,
  stubFetchReject,
} from "@/tests/helpers/proxy";

const encoder = new TextEncoder();

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("parseAgentEventFrame", () => {
  it("解析 event + data，并在 data 缺少 type 时使用 event 名", () => {
    expect(
      parseAgentEventFrame(
        [
          "event: answer",
          'data: {"content":"## 解题思路","format":"markdown"}',
        ].join("\n"),
      ),
    ).toEqual({
      type: "answer",
      content: "## 解题思路",
      format: "markdown",
    });
  });

  it("支持多行 data 和 CRLF", () => {
    expect(
      parseAgentEventFrame(
        [
          "event: execution",
          'data: {"type":"execution",',
          'data: "stage":"start","tool":"images_to_pdf","content":"处理中"}',
        ].join("\r\n"),
      ),
    ).toEqual({
      type: "execution",
      stage: "start",
      tool: "images_to_pdf",
      content: "处理中",
    });
  });

  it("忽略注释与空 data，未知事件类型会报错", () => {
    expect(parseAgentEventFrame(": heartbeat")).toBeNull();
    expect(() => parseAgentEventFrame("event: mystery\ndata: {}")).toThrow(
      "未知的 Agent SSE 事件类型",
    );
  });
});

describe("readAgentEventStream", () => {
  it("跨 chunk 拼接 frame，并解码被拆开的 UTF-8 字符", async () => {
    const payload =
      'event: thinking\r\ndata: {"type":"thinking","content":"先分析题意"}\r\n\r\n' +
      'event: answer\ndata: {"type":"answer","content":"答案是 42"}\n\n';
    const bytes = encoder.encode(payload);
    const splitAt = bytes.indexOf(0xe6) + 1;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, splitAt));
        controller.enqueue(bytes.slice(splitAt, splitAt + 7));
        controller.enqueue(bytes.slice(splitAt + 7));
        controller.close();
      },
    });
    const events: TAgentEvent[] = [];

    await readAgentEventStream(stream, (event) => events.push(event));

    expect(events).toEqual([
      { type: "thinking", content: "先分析题意" },
      { type: "answer", content: "答案是 42" },
    ]);
  });

  it("流结束时处理没有尾部空行的最后一个 frame", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'event: done\ndata: {"type":"done","requestId":"rid-1","durationMs":88}',
          ),
        );
        controller.close();
      },
    });
    const onEvent = jest.fn<(event: TAgentEvent) => void>();

    await readAgentEventStream(stream, onEvent);

    expect(onEvent).toHaveBeenCalledWith({
      type: "done",
      requestId: "rid-1",
      durationMs: 88,
    });
  });
});

describe("streamAgentChat", () => {
  it("发送身份、会话与最后 20 条历史，并逐条回调事件", async () => {
    const fetchMock = stubFetch(
      new Response(
        'event: answer\ndata: {"type":"answer","content":"你好"}\n\n',
        {
          status: 200,
          headers: { "Content-Type": "text/event-stream; charset=utf-8" },
        },
      ),
    );
    const onEvent = jest.fn<(event: TAgentEvent) => void>();
    const history = Array.from({ length: 25 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `history-${index}`,
    }));

    await streamAgentChat({
      openid: "openid-1",
      message: "帮我制定学习计划",
      conversationId: "conversation-1",
      history,
      onEvent,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/ai/agent/chat");
    expect(new Headers(init?.headers).get("x-user-id")).toBe("openid-1");
    expect(new Headers(init?.headers).get("x-lane")).toBe("whale");
    expect(JSON.parse(String(init?.body))).toEqual({
      message: "帮我制定学习计划",
      conversationId: "conversation-1",
      history: history.slice(-20),
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: "answer",
      content: "你好",
    });
  });

  it("建流前错误优先展示上游 JSON message", async () => {
    stubFetch(
      new Response(JSON.stringify({ status: 401, message: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      streamAgentChat({
        openid: "",
        message: "hello",
        onEvent: jest.fn(),
      }),
    ).rejects.toThrow("请先登录");
  });

  it("有图片时把 imageBase64 放入聊天请求体", async () => {
    const fetchMock = stubFetch(
      new Response('event: done\ndata: {"type":"done"}\n\n', {
        status: 200,
        headers: { "Content-Type": "text/event-stream; charset=utf-8" },
      }),
    );
    const imageBase64 = "data:image/jpeg;base64,aW1hZ2U=";

    await streamAgentChat({
      openid: "openid-1",
      message: "看图解题",
      imageBase64,
      conversationId: "conversation-1",
      onEvent: jest.fn(),
    });

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      message: "看图解题",
      imageBase64,
      conversationId: "conversation-1",
    });
  });

  it("网络失败时抛出原始错误", async () => {
    stubFetchReject(new Error("network down"));

    await expect(
      streamAgentChat({
        openid: "openid-1",
        message: "hello",
        onEvent: jest.fn(),
      }),
    ).rejects.toThrow("network down");
  });
});
