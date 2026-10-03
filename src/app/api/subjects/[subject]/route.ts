import { NextRequest, NextResponse } from "next/server";

import { getSubject } from "@/app/subjects/subjects";
import { getApiHost } from "@/utils";
import { loadSubjectPrompt } from "@/utils/prompts";

type TRouteContext = {
  params: Promise<{ subject: string }>;
};

/** POST /api/ai/subjects 的响应体 */
type TSubjectAiResponse = {
  status?: number;
  data?: unknown;
  message?: string;
};

/**
 * 学科内容生成：把选项与系统提示词（src/prompts/<slug>.md）交给后端出题接口
 * `POST api/ai/subjects`（见 AI 出题接口对接文档）。
 *
 * 调用方式（文档 2、3 节）：
 * - POST `${getApiHost()}api/ai/subjects`，body 为 `{ config, prompt }`，两者都必填；
 * - config 由服务端 JSON.stringify 后作为用户消息，prompt 作为 System Prompt；
 * - 成功返回 `{ status: 200, data: "模型返回的纯文本" }`，
 *   失败时 HTTP 500 而 body.status 是 404，所以 HTTP 与 body.status 都要判断。
 */
export async function POST(request: NextRequest, { params }: TRouteContext) {
  const { subject: slug } = await params;
  const subject = getSubject(slug);

  if (!subject) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 404 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    options?: Record<string, unknown>;
  };

  const headers = new Headers({ "content-type": "application/json" });
  const userId = request.headers.get("x-user-id");
  if (userId) headers.set("x-user-id", userId);

  try {
    const response = await fetch(getApiHost() + "api/ai/subjects", {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        config: { subject: subject.slug, ...(payload.options ?? {}) },
        prompt: loadSubjectPrompt(subject.slug),
      }),
    });

    const body = (await response
      .json()
      .catch(() => null)) as TSubjectAiResponse | null;

    if (!response.ok || body?.status !== 200) {
      return NextResponse.json(
        { error: body?.message || "出题失败，请稍后重试" },
        { status: response.ok ? 500 : response.status },
      );
    }

    return NextResponse.json({ data: body.data });
  } catch (error) {
    console.error("Error generating subject content:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
