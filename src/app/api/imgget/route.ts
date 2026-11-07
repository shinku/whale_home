import { NextRequest, NextResponse } from "next/server";

import { getCachedImage, setCachedImage } from "./cache";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;

const normalizeImageUrl = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    const allowedHost =
      url.hostname === "fms.whalepea.com" ||
      url.hostname.endsWith(".whalepea.com");
    if (url.protocol !== "https:" || !allowedHost) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const imageResponse = (image: {
  data: ArrayBuffer;
  contentType: string;
}) =>
  new Response(image.data, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });

const downloadImage = async (url: string) => {
  const cached = getCachedImage(url);
  if (cached) return cached;

  const upstream = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!upstream.ok) {
    throw new Error(`图片下载失败：HTTP ${upstream.status}`);
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error("远端内容不是图片");
  }

  const data = await upstream.arrayBuffer();
  if (data.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("图片不能超过 20MB");
  }

  const image = { data, contentType };
  setCachedImage(url, image);
  return image;
};

const handleImageRequest = async (rawUrl: unknown) => {
  const url = normalizeImageUrl(rawUrl);
  if (!url) {
    return NextResponse.json(
      { error: "图片地址无效" },
      { status: 400 },
    );
  }

  try {
    return imageResponse(await downloadImage(url));
  } catch (error) {
    console.error("Error downloading image:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "图片下载失败，请稍后重试",
      },
      { status: 502 },
    );
  }
};

/** GET /api/imgget?url=https://fms.whalepea.com/... */
export async function GET(request: NextRequest) {
  return handleImageRequest(request.nextUrl.searchParams.get("url"));
}

/** POST /api/imgget，body: { url: string } */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    url?: unknown;
  };
  return handleImageRequest(body.url);
}
