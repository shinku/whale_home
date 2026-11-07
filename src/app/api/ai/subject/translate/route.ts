import { NextRequest, NextResponse } from "next/server";

import {
  normalizeTranslateDirection,
  normalizeImageDimension,
  normalizeTranslateSource,
  type TTranslateApiResponse,
} from "@/app/subjects/translate/types";
import { getApiHost } from "@/utils";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const imageFromPayload = (payload: Record<string, unknown>) => {
  if (typeof payload.source === "string" && payload.source.trim()) {
    return payload.source.trim();
  }
  if (typeof payload.imageBase64 === "string" && payload.imageBase64.trim()) {
    return payload.imageBase64.trim();
  }
  if (typeof payload.image === "string" && payload.image.trim()) {
    return payload.image.trim();
  }
  return "";
};

const base64ByteLength = (image: string) => {
  const encoded = image.replace(/^data:image\/[^;,]+;base64,/i, "");
  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  return Math.floor((encoded.length * 3) / 4) - padding;
};

/** 拍照翻译：只接受单张 Base64 图片，转发给上游 Qwen 图片翻译接口。 */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const image = imageFromPayload(payload);
  const direction = normalizeTranslateDirection(payload.direction);

  if (!image) {
    return NextResponse.json(
      { error: "请上传需要翻译的图片" },
      { status: 400 },
    );
  }
  if (/^https?:\/\//i.test(image)) {
    return NextResponse.json(
      { error: "只支持 Base64 图片" },
      { status: 400 },
    );
  }
  if (
    image.startsWith("data:") &&
    !/^data:image\/[^;,]+;base64,/i.test(image)
  ) {
    return NextResponse.json(
      { error: "图片格式不支持" },
      { status: 400 },
    );
  }
  if (base64ByteLength(image) > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "图片不能超过 10MB" },
      { status: 413 },
    );
  }

  const headers = new Headers({ "content-type": "application/json" });
  const userId = request.headers.get("x-user-id")?.trim();
  if (userId) headers.set("x-user-id", userId);

  try {
    const response = await fetch(`${getApiHost()}api/ai/subject/translate`, {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({ source: image, direction }),
    });
    const body = (await response
      .json()
      .catch(() => null)) as TTranslateApiResponse | null;

    if (
      !response.ok ||
      body?.status !== 200 ||
      typeof body.data?.source !== "string" ||
      !Array.isArray(body.data.result) ||
      typeof body.id !== "string" ||
      !body.id
    ) {
      return NextResponse.json(
        { error: body?.message || "图片翻译失败，请稍后重试" },
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
      id: body.id,
    });
  } catch (error) {
    console.error("Error translating image:", error);
    return NextResponse.json(
      { error: "图片翻译失败，请稍后重试" },
      { status: 500 },
    );
  }
}
