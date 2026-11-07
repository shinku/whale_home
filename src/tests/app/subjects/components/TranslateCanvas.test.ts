import { describe, expect, it } from "@jest/globals";

import {
  calculateCanvasTransform,
  resolveTranslateImageSource,
} from "@/app/subjects/components/TranslateCanvas";

describe("resolveTranslateImageSource", () => {
  it("远程图片统一走 imgget 代理", () => {
    const url =
      "https://fms.whalepea.com/pub/ai-translate/example.png";
    expect(resolveTranslateImageSource(url)).toBe(
      `/api/imgget?url=${encodeURIComponent(url)}`,
    );
  });

  it("Data URL 和裸 Base64 直接交给 Canvas", () => {
    const dataUrl = "data:image/png;base64,abc";
    expect(resolveTranslateImageSource(dataUrl)).toBe(dataUrl);
    expect(resolveTranslateImageSource("abc")).toBe(
      "data:image/jpeg;base64,abc",
    );
  });

  it("按解析图片尺寸计算缩放和居中偏移", () => {
    const transform = calculateCanvasTransform({
      canvasWidth: 800,
      canvasHeight: 600,
      imageWidth: 1920,
      imageHeight: 1080,
    });

    expect(transform.scale).toBeCloseTo(800 / 1920);
    expect(transform.offsetX).toBeCloseTo(0);
    expect(transform.offsetY).toBeCloseTo(
      (600 - 1080 * (800 / 1920)) / 2,
    );
  });
});
