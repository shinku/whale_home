import { NextRequest, NextResponse } from "next/server";

import { getSubject } from "@/app/subjects/subjects";
import { generateSubject, getSubjectByRequestId } from "@/app/subjects/service";

type TRouteContext = {
  params: Promise<{ subject: string }>;
};

const userIdOf = (request: NextRequest) =>
  request.headers.get("x-user-id") ?? undefined;

/**
 * 出题：把选项与系统提示词（src/prompts/<slug>.md）交给后端
 * `POST api/ai/subjects`（见 AI 出题接口对接文档 2、3 节），
 * 成功时连同 requestid 一起返回，前端凭它跳到详情页。
 *
 * 失败时 HTTP 500 而 body.status 是 404，所以 HTTP 与 body.status 都要判断。
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

  const result = await generateSubject({
    subject,
    options: payload?.options,
    userId: userIdOf(request),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    data: result.data,
    requestid: result.requestid,
  });
}

/**
 * 按 requestid 复查这次出题结果（24 小时内有效）：
 * 转发到 `GET api/ai/subjects?requestid=xxx`，响应形态与 POST 一致。
 */
export async function GET(request: NextRequest, { params }: TRouteContext) {
  const { subject: slug } = await params;
  const subject = getSubject(slug);

  if (!subject) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 404 });
  }

  const requestid = request.nextUrl.searchParams.get("requestid")?.trim() ?? "";
  if (!requestid) {
    return NextResponse.json(
      { error: "requestid is required" },
      { status: 400 },
    );
  }

  const result = await getSubjectByRequestId({
    requestid,
    userId: userIdOf(request),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    data: result.data,
    requestid: result.requestid,
  });
}
