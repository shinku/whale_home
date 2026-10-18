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
  /** 前端拼好的 HTML（卷面），两个接口都以它作为输入 */
  html?: unknown;
  /** PDF 纸张尺寸，默认 A4 */
  format?: unknown;
  /** PDF 是否横向，默认 false */
  landscape?: unknown;
  /** PDF 是否打印背景，默认 true */
  printBackground?: unknown;
  /**
   * html2doc 的转换策略：`pdfkit-convert` 保真（整页图片，不可编辑）、
   * `regural` 真可编辑但还原度低
   */
  toStrategy?: "pdfkit-convert" | "regural";
};

/** 一种转换：上游路径 + 把前端 payload 拼成上游 body */
type TConverter = {
  /** 上游路径（拼在 getApiHost() 之后），如 "api/file/base64_to_pdf" */
  path: string;
  /** 把前端 payload 转成上游接口需要的 body */
  buildBody: (payload: TConvertPayload) => Record<string, unknown>;
};

export const CONVERTERS: Record<string, TConverter> = {
  /** HTML -> PDF（无头 Chromium 打印），上游 POST /api/file/html_to_pdf */
  html2pdf: {
    path: "api/file/html_to_pdf",
    buildBody: ({ html, format, landscape, printBackground }) => ({
      html: typeof html === "string" ? html : "",
      format: typeof format === "string" && format ? format : "A4",
      landscape: landscape === true,
      print_background: printBackground !== false,
    }),
  },
  /** HTML -> Word（docx），上游 POST /api/file/html_to_doc */
  html2doc: {
    path: "api/file/html_to_doc",
    buildBody: ({ html, toStrategy }) => ({
      html: typeof html === "string" ? html : "",
      // 不传时默认走保真策略；传了的值原样透传（非法值由上游按 regural 兜底）
      toStrategy: toStrategy || "pdfkit-convert",
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
