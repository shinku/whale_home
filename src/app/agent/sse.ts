import type { TAgentEvent } from "./types";

export const MAX_AGENT_MESSAGE_LENGTH = 8000;
export const MAX_AGENT_HISTORY_LENGTH = 20;

export type TAgentHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TStreamAgentChatOptions = {
  baseURL?: string;
  openid: string;
  message: string;
  imageBase64?: string;
  conversationId?: string;
  history?: TAgentHistoryMessage[];
  lane?: string;
  signal?: AbortSignal;
  onEvent: (event: TAgentEvent) => void;
};

const AGENT_EVENT_TYPES = new Set([
  "session",
  "thinking",
  "execution",
  "answer",
  "done",
  "error",
]);

/**
 * 解析一个完整 SSE frame。event 名作为 data.type 缺失时的兜底，
 * data 可以跨多行出现。
 */
export const parseAgentEventFrame = (frame: string): TAgentEvent | null => {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const rawLine of frame.split(/\r?\n/)) {
    if (!rawLine || rawLine.startsWith(":")) continue;

    const colonIndex = rawLine.indexOf(":");
    const field = colonIndex === -1 ? rawLine : rawLine.slice(0, colonIndex);
    let value = colonIndex === -1 ? "" : rawLine.slice(colonIndex + 1);
    if (value.startsWith(" ")) value = value.slice(1);

    if (field === "event") eventName = value.trim();
    if (field === "data") dataLines.push(value);
  }

  if (dataLines.length === 0) return null;

  const data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
  const type =
    typeof data.type === "string" && data.type ? data.type : eventName;

  if (!AGENT_EVENT_TYPES.has(type)) {
    throw new Error(`未知的 Agent SSE 事件类型：${type}`);
  }

  return { ...data, type } as TAgentEvent;
};

/** 逐块读取 SSE，只有收到空行分隔符时才分发完整 frame。 */
export const readAgentEventStream = async (
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: TAgentEvent) => void,
) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const dispatch = (frame: string) => {
    if (!frame.trim()) return;
    const event = parseAgentEventFrame(frame);
    if (event) onEvent(event);
  };

  const drain = (flush = false) => {
    let boundary = buffer.search(/\r?\n\r?\n/);
    while (boundary >= 0) {
      const delimiter = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] ?? "";
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + delimiter.length);
      dispatch(frame);
      boundary = buffer.search(/\r?\n\r?\n/);
    }

    if (flush && buffer.trim()) {
      dispatch(buffer);
      buffer = "";
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      drain();
    }

    buffer += decoder.decode();
    drain(true);
  } finally {
    reader.releaseLock();
  }
};

/** 使用 POST fetch 建立 SSE 连接；浏览器原生 EventSource 不支持该协议形态。 */
export const streamAgentChat = async ({
  baseURL = "",
  openid,
  message,
  imageBase64,
  conversationId,
  history,
  lane = "whale",
  signal,
  onEvent,
}: TStreamAgentChatOptions) => {
  const response = await fetch(
    `${baseURL.replace(/\/$/, "")}/api/ai/agent/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "x-user-id": openid,
        "x-lane": lane,
      },
      body: JSON.stringify({
        message,
        ...(imageBase64 ? { imageBase64 } : {}),
        ...(conversationId ? { conversationId } : {}),
        ...(history?.length
          ? { history: history.slice(-MAX_AGENT_HISTORY_LENGTH) }
          : {}),
      }),
      signal,
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;
    throw new Error(
      body?.message || body?.error || `请求失败：HTTP ${response.status}`,
    );
  }

  if (!response.body) {
    throw new Error("当前浏览器不支持 ReadableStream");
  }

  await readAgentEventStream(response.body, onEvent);
};
