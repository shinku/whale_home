import { describe, expect, it } from "@jest/globals";

import { calculateImageHeight } from "@/app/agent/imageBase64";

describe("calculateImageHeight", () => {
  it("保持原始宽高比并固定输出宽度 800", () => {
    expect(calculateImageHeight(1200, 900)).toBe(600);
    expect(calculateImageHeight(600, 1200)).toBe(1600);
    expect(calculateImageHeight(1000, 333)).toBe(266);
  });

  it("拒绝无效图片尺寸", () => {
    expect(() => calculateImageHeight(0, 100)).toThrow("图片尺寸无效");
    expect(() => calculateImageHeight(100, 0)).toThrow("图片尺寸无效");
  });
});
