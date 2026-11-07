import { describe, expect, it } from "@jest/globals";

import {
  DEFAULT_TRANSLATE_DIRECTION,
  normalizeImageDimension,
  normalizeTranslateBlocks,
  normalizeTranslateDirection,
  normalizeTranslateSource,
  TRANSLATE_FALLBACK_BACKGROUND,
  TRANSLATE_IMAGE_HOST,
  TRANSLATE_FALLBACK_COLOR,
} from "@/app/subjects/translate/types";

describe("normalizeImageDimension", () => {
  it("只接受大于 0 的有限尺寸", () => {
    expect(normalizeImageDimension(1920)).toBe(1920);
    expect(normalizeImageDimension("1080")).toBe(1080);
    expect(normalizeImageDimension(0)).toBe(0);
    expect(normalizeImageDimension(-1)).toBe(0);
    expect(normalizeImageDimension("invalid")).toBe(0);
  });
});

describe("normalizeTranslateSource", () => {
  it("为 OSS 对象路径补全 fms 域名", () => {
    expect(
      normalizeTranslateSource(
        "pub/ai-translate/translate_1794057015385_example.png",
      ),
    ).toBe(
      `${TRANSLATE_IMAGE_HOST}pub/ai-translate/translate_1794057015385_example.png`,
    );
    expect(normalizeTranslateSource("/pub/a.jpg")).toBe(
      `${TRANSLATE_IMAGE_HOST}pub/a.jpg`,
    );
  });

  it("完整地址、Data URL 和裸 Base64 保持原值", () => {
    const url = "https://fms.whalepea.com/pub/a.png";
    const dataUrl = "data:image/png;base64,abc";
    expect(normalizeTranslateSource(url)).toBe(url);
    expect(normalizeTranslateSource(dataUrl)).toBe(dataUrl);
    expect(normalizeTranslateSource("YWJj")).toBe("YWJj");
  });
});

describe("normalizeTranslateDirection", () => {
  it("支持中英双向翻译，默认英译中", () => {
    expect(normalizeTranslateDirection("en_to_zh")).toBe("en_to_zh");
    expect(normalizeTranslateDirection("zh_to_en")).toBe("zh_to_en");
    expect(normalizeTranslateDirection("invalid")).toBe(
      DEFAULT_TRANSLATE_DIRECTION,
    );
    expect(normalizeTranslateDirection(undefined)).toBe("en_to_zh");
  });
});

describe("normalizeTranslateBlocks", () => {
  it("保留有效文字、矩形和颜色", () => {
    expect(
      normalizeTranslateBlocks([
        {
          message: " 你好 ",
          rect: { x: 10, y: 20, w: 100, h: 30 },
          color: "#112233",
          background: "#f0f1f2",
          fontSize: 18,
        },
      ]),
    ).toEqual([
      {
        message: "你好",
        rect: { x: 10, y: 20, w: 100, h: 30 },
        color: "#112233",
        background: "#f0f1f2",
        fontSize: 18,
      },
    ]);
  });

  it("过滤空文本和无效矩形，并回退无效颜色", () => {
    expect(
      normalizeTranslateBlocks([
        {
          message: "有效",
          rect: { x: -2, y: 1, w: 10, h: 8 },
          fontSize: 16,
        },
        { message: "", rect: { x: 1, y: 1, w: 10, h: 8 } },
        { message: "零宽", rect: { x: 1, y: 1, w: 0, h: 8 } },
      ]),
    ).toEqual([
      {
        message: "有效",
        rect: { x: 0, y: 1, w: 10, h: 8 },
        color: TRANSLATE_FALLBACK_COLOR,
        background: TRANSLATE_FALLBACK_BACKGROUND,
        fontSize: 16,
      },
    ]);
  });

  it("深色背景上的白色文字保持 #ffffff 和接口字号", () => {
    expect(
      normalizeTranslateBlocks([
        {
          message: "我的周末",
          rect: { x: 20, y: 235, w: 180, h: 30 },
          color: "#ffffff",
          background: "#1e1e1e",
          fontSize: 24,
        },
      ]),
    ).toEqual([
      {
        message: "我的周末",
        rect: { x: 20, y: 235, w: 180, h: 30 },
        color: "#ffffff",
        background: "#1e1e1e",
        fontSize: 24,
      },
    ]);
  });

  it("非数组返回空 blocks", () => {
    expect(normalizeTranslateBlocks(null)).toEqual([]);
    expect(normalizeTranslateBlocks({ message: "x" })).toEqual([]);
  });
});
