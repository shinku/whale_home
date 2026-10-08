import { NextRequest, NextResponse } from "next/server";

import { getApiHost } from "@/utils";

/**
 * 通用「转换」转发路由：前端把素材交给这里，由服务端转发到上游对应的转换接口。
 *
 * 用 map（CONVERTERS）组织，方便后期扩展：新增一种转换只要加一条，
 * key 就是前端传的 `convertType` —— 目前只有一个 base642pdf。
 */
export type TConvertPayload = {
  /** 转换类型，对应 CONVERTERS 的 key */
  convertType?: string;
  /** 图片 base64 列表（可带 data URL 前缀），数组顺序即 PDF 页序 */
  base64List?: unknown;
};

/** 一种转换：上游路径 + 把前端 payload 拼成上游 body */
type TConverter = {
  /** 上游路径（拼在 getApiHost() 之后），如 "api/file/base64_to_pdf" */
  path: string;
  /** 把前端 payload 转成上游接口需要的 body */
  buildBody: (payload: TConvertPayload) => Record<string, unknown>;
};

export const CONVERTERS: Record<string, TConverter> = {
  /** 图片 base64 -> PDF，上游 POST /api/file/base64_to_pdf */
  base642pdf: {
    path: "api/file/base64_to_pdf",
    buildBody: ({ base64List }) => ({
      base64_list: Array.isArray(base64List) ? base64List : [],
    }),
  },
};

/** 上游响应的业务状态：成功固定 200，失败时 HTTP 500 而 body.status 是 404 */
type TConvertResponse = {
  status?: number;
  data?: unknown;
  message?: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as TConvertPayload;
  const converter: TConverter | undefined = payload.convertType
    ? CONVERTERS[payload.convertType]
    : undefined;

  if (!converter) {
    return NextResponse.json({ error: "Unknown convertType" }, { status: 400 });
  }

  const headers = new Headers({ "content-type": "application/json" });
  const userId = request.headers.get("x-user-id");
  if (userId) headers.set("x-user-id", userId);

  try {
    const response = await fetch(getApiHost() + converter.path, {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify(converter.buildBody(payload)),
    });

    const body = (await response
      .json()
      .catch(() => null)) as TConvertResponse | null;

    // 上游失败时 HTTP 500 而 body.status 是 404，两个都要判断
    if (!response.ok || body?.status !== 200) {
      return NextResponse.json(
        { error: body?.message || "转换失败，请稍后重试" },
        { status: response.ok ? 500 : response.status },
      );
    }

    return NextResponse.json({ data: body.data });
  } catch (error) {
    console.error("Error converting:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
