export type TTranslateBlock = {
  message: string;
  rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  color: string;
  background: string;
  fontSize: number;
};

export type TTranslateDirection = "en_to_zh" | "zh_to_en";

export const DEFAULT_TRANSLATE_DIRECTION: TTranslateDirection = "en_to_zh";

export const normalizeTranslateDirection = (
  value: unknown,
): TTranslateDirection =>
  value === "zh_to_en" ? "zh_to_en" : DEFAULT_TRANSLATE_DIRECTION;

export type TTranslateApiResponse = {
  status?: number;
  data?: {
    source: string;
    result: unknown;
    direction?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
  id?: string;
  message?: string;
  error?: string;
};

export const TRANSLATE_FALLBACK_COLOR = "#333333";
export const TRANSLATE_FALLBACK_BACKGROUND = "#ffffff";
export const TRANSLATE_IMAGE_HOST = "https://fms.whalepea.com/";

export const normalizeImageDimension = (value: unknown) => {
  const dimension = Number(value);
  return Number.isFinite(dimension) && dimension > 0 ? dimension : 0;
};

/**
 * 翻译接口的 source 可能是 OSS 对象路径，Next 服务端统一补全域名。
 * data URL、完整 HTTP(S) 地址和裸 Base64 保持原值。
 */
export const normalizeTranslateSource = (value: string) => {
  const source = value.trim();
  if (!source) return "";
  if (/^(?:data:|https?:\/\/)/i.test(source)) return source;

  const looksLikeObjectPath =
    source.includes("/") &&
    /\.(?:png|jpe?g|webp|gif|bmp)(?:$|\?)/i.test(source);
  if (looksLikeObjectPath) {
    return `${TRANSLATE_IMAGE_HOST}${source.replace(/^\/+/, "")}`;
  }

  return source;
};

/** 容错解析 Canvas 绘制所需的翻译块，过滤缺失文本或无效矩形。 */
export const normalizeTranslateBlocks = (value: unknown): TTranslateBlock[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const rect =
      item.rect && typeof item.rect === "object"
        ? (item.rect as Record<string, unknown>)
        : null;
    const message =
      typeof item.message === "string" ? item.message.trim() : "";
    const x = Number(rect?.x);
    const y = Number(rect?.y);
    const w = Number(rect?.w);
    const h = Number(rect?.h);
    const fontSize = Number(item.fontSize);

    if (
      !message ||
      !rect ||
      ![x, y, w, h].every(Number.isFinite) ||
      w <= 0 ||
      h <= 0
    ) {
      return [];
    }

    return [
      {
        message,
        rect: {
          x: Math.max(0, x),
          y: Math.max(0, y),
          w,
          h,
        },
        color:
          typeof item.color === "string" &&
          /^#[0-9a-f]{6}$/i.test(item.color)
            ? item.color
            : TRANSLATE_FALLBACK_COLOR,
        background:
          typeof item.background === "string" &&
          /^#[0-9a-f]{6}$/i.test(item.background)
            ? item.background
            : TRANSLATE_FALLBACK_BACKGROUND,
        fontSize:
          Number.isFinite(fontSize) && fontSize > 0
            ? fontSize
            : Math.max(8, Math.floor(h * 0.72)),
      },
    ];
  });
};
