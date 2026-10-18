import { getApiHost } from "@/utils";
import { loadSubjectPrompt } from "@/utils/prompts";

import type { TSubject } from "./subjects";

/**
 * 出题接口（`POST /api/ai/subjects` 与 `GET /api/ai/subjects?requestid=`）的服务层。
 *
 * 同时被两处复用：
 * - `src/app/api/subjects/[subject]/route.ts`：给前端配置页的 POST / GET 代理；
 * - `src/app/subjects/components/SubjectDetailPage.tsx`：详情页 SSR 直接取数，
 *   省掉「页面 → 自家 API → 上游」多一跳。
 */
type TSubjectAiResponse = {
  status?: number;
  data?: unknown;
  requestid?: string;
  message?: string;
};

export type TSubjectFetchResult =
  | { ok: true; data: unknown; requestid: string }
  | { ok: false; error: string; status: number };

/** 只转发 x-user-id（小程序 userId / openid），不透传客户端的其他头 */
const requestHeaders = (userId?: string) => {
  const headers = new Headers({ "content-type": "application/json" });
  if (userId) headers.set("x-user-id", userId);
  return headers;
};

/**
 * 读取接口把「记录不存在/已过期」当作业务信息返回，
 * 这里翻译成用户能看懂的中文提示（其余情况保留上游原文）。
 */
const readErrorMessage = (message?: string) => {
  switch (message) {
    case "requestid is required":
      return "缺少 requestid";
    case "subject not found":
    case "subject is expired":
      return "结果不存在或已过期";
    default:
      return message || "读取结果失败，请稍后重试";
  }
};

/**
 * 按配置出题：把选项与系统提示词（src/prompts/<slug>.md）交给
 * `POST api/ai/subjects`，成功时同时拿到模型文本与可复查的 requestid。
 *
 * config 里额外带一个每次都不同的 `随机种子`：模型没有跨请求记忆，
 * 同一套选项反复生成时靠它当随机源，避免每次都出同一批题
 * （对应各 prompt 里的「随机种子与多样性」小节）。
 */
export const generateSubject = async ({
  subject,
  options,
  userId,
}: {
  subject: TSubject;
  options?: Record<string, unknown>;
  userId?: string;
}): Promise<TSubjectFetchResult> => {
  // 毫秒时间戳 + 随机串，保证每次调用的种子都不同
  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const response = await fetch(getApiHost() + "api/ai/subjects", {
      method: "POST",
      headers: requestHeaders(userId),
      cache: "no-store",
      body: JSON.stringify({
        config: {
          subject: subject.slug,
          ...(options ?? {}),
          随机种子: seed,
        },
        prompt: loadSubjectPrompt(subject.slug),
      }),
    });

    const body = (await response
      .json()
      .catch(() => null)) as TSubjectAiResponse | null;

    if (!response.ok || body?.status !== 200 || body.data == null) {
      return {
        ok: false,
        error: body?.message || "出题失败，请稍后重试",
        status: response.ok ? 500 : response.status,
      };
    }

    return { ok: true, data: body.data, requestid: body.requestid ?? "" };
  } catch (error) {
    console.error("Error generating subject content:", error);
    return { ok: false, error: "Internal Server Error", status: 500 };
  }
};

/** 按 requestid 复查出题结果（24 小时内有效） */
export const getSubjectByRequestId = async ({
  requestid,
  userId,
}: {
  requestid: string;
  userId?: string;
}): Promise<TSubjectFetchResult> => {
  const url = `${getApiHost()}api/ai/subjects?requestid=${encodeURIComponent(requestid)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: requestHeaders(userId),
      cache: "no-store",
    });

    const body = (await response
      .json()
      .catch(() => null)) as TSubjectAiResponse | null;

    if (!response.ok || body?.status !== 200 || body.data == null) {
      return {
        ok: false,
        error: readErrorMessage(body?.message),
        status: response.ok ? 500 : response.status,
      };
    }

    return {
      ok: true,
      data: body.data,
      requestid: body.requestid || requestid,
    };
  } catch (error) {
    console.error("Error reading subject content:", error);
    return { ok: false, error: "读取结果失败，请稍后重试", status: 500 };
  }
};
