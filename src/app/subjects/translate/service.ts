import { getApiHost } from "@/utils";

import {
  normalizeTranslateSource,
  normalizeTranslateBlocks,
  normalizeImageDimension,
  normalizeTranslateDirection,
  type TTranslateApiResponse,
  type TTranslateBlock,
} from "./types";

export type TTranslateStoredResult = {
  source: string;
  result: TTranslateBlock[];
  id: string;
  direction: string;
  imageWidth: number;
  imageHeight: number;
};

export type TTranslateFetchResult =
  | { ok: true; data: TTranslateStoredResult }
  | { ok: false; error: string; status: number };

const requestHeaders = (userId?: string) => {
  const headers = new Headers({ "content-type": "application/json" });
  if (userId) headers.set("x-user-id", userId);
  return headers;
};

export const getTranslateResultById = async ({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}): Promise<TTranslateFetchResult> => {
  try {
    const response = await fetch(
      `${getApiHost()}api/ai/subject/translate/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: requestHeaders(userId),
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
      return {
        ok: false,
        error: body?.message || "翻译结果不存在或已过期",
        status: response.ok ? 500 : response.status,
      };
    }

    return {
      ok: true,
      data: {
        source: normalizeTranslateSource(body.data.source),
        result: normalizeTranslateBlocks(body.data.result),
        id: body.id || id,
        direction: normalizeTranslateDirection(body.data.direction),
        imageWidth: normalizeImageDimension(body.data.imageWidth),
        imageHeight: normalizeImageDimension(body.data.imageHeight),
      },
    };
  } catch (error) {
    console.error("Error reading translate result:", error);
    return { ok: false, error: "读取翻译结果失败，请稍后重试", status: 500 };
  }
};
