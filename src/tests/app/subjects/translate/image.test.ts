import { describe, expect, it } from "@jest/globals";

import {
  calculateImageSize,
  TRANSLATE_IMAGE_WIDTH,
} from "@/app/subjects/translate/image";

describe("calculateImageSize", () => {
  it("固定 800px 宽并按原图比例计算高度", () => {
    expect(
      calculateImageSize({
        naturalWidth: 1200,
        naturalHeight: 1800,
      }),
    ).toEqual({ width: TRANSLATE_IMAGE_WIDTH, height: 1200 });
  });

  it("小图也统一放大到 800px 宽", () => {
    expect(
      calculateImageSize({
        naturalWidth: 320,
        naturalHeight: 240,
      }),
    ).toEqual({ width: 800, height: 600 });
  });

  it("可按指定宽度计算，高度保持比例", () => {
    expect(
      calculateImageSize({
        naturalWidth: 100,
        naturalHeight: 50,
        targetWidth: 200,
      }),
    ).toEqual({ width: 200, height: 100 });
  });
});
