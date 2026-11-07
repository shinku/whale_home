import { NextRequest, NextResponse } from "next/server";

import {
  normalizeImageDimension,
  normalizeTranslateDirection,
  normalizeTranslateSource,
  type TTranslateApiResponse,
} from "@/app/subjects/translate/types";
import { getApiHost } from "@/utils";

/** 按翻译结果 id 读取 24 小时内保存的原图和 blocks。 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id.trim()) {
    return NextResponse.json({ error: "缺少翻译结果 id" }, { status: 400 });
  }

  const headers = new Headers({ "content-type": "application/json" });
  const userId = request.headers.get("x-user-id")?.trim();
  if (userId) headers.set("x-user-id", userId);

  try {
    const response = await fetch(
      `${getApiHost()}api/ai/subject/translate/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );
    const body = (await response
      .json()
      .catch(() => null)) as TTranslateApiResponse | null;

    if (
      !response.ok ||
      body?.status !== 200 ||
      typeof body.data?.source !== "string" ||
      !Array.isArray(body.data.result)
    ) {
      return NextResponse.json(
        { error: body?.message || "翻译结果不存在或已过期" },
        { status: response.ok ? 500 : response.status },
      );
    }

    return NextResponse.json({
      status: 200,
      data: {
        source: normalizeTranslateSource(body.data.source),
        result: body.data.result,
        direction: normalizeTranslateDirection(body.data.direction),
        imageWidth: normalizeImageDimension(body.data.imageWidth),
        imageHeight: normalizeImageDimension(body.data.imageHeight),
      },
      id: body.id || id,
    });
  } catch (error) {
    console.error("Error reading translate result:", error);
    return NextResponse.json(
      { error: "读取翻译结果失败，请稍后重试" },
      { status: 500 },
    );
  }
}
