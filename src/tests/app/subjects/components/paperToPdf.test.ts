import { describe, expect, it } from "@jest/globals";

import {
  A4_PAGE_RATIO,
  splitIntoPages,
} from "@/app/subjects/components/paperToPdf";

describe("splitIntoPages", () => {
  it("A4 比例是 297 / 210", () => {
    expect(A4_PAGE_RATIO).toBeCloseTo(297 / 210, 6);
  });

  it("一屏以内只切一页，页高按宽度算", () => {
    const { pageHeight, slices } = splitIntoPages(794, 800);

    expect(pageHeight).toBe(Math.round(794 * A4_PAGE_RATIO));
    expect(pageHeight).toBe(1123);
    expect(slices).toEqual([{ top: 0, height: 800 }]);
  });

  it("刚好一屏切成整一页", () => {
    const { pageHeight, slices } = splitIntoPages(794, 1123);

    expect(slices).toEqual([{ top: 0, height: pageHeight }]);
  });

  it("超过一屏按 A4 高度切多页，最后一页取剩余高度", () => {
    const { pageHeight, slices } = splitIntoPages(794, 1123 * 2 + 10);

    expect(slices).toEqual([
      { top: 0, height: pageHeight },
      { top: pageHeight, height: pageHeight },
      { top: pageHeight * 2, height: 10 },
    ]);
  });

  it("高度为 0 时不切页", () => {
    expect(splitIntoPages(794, 0).slices).toEqual([]);
  });

  it("宽度为 0 时页高至少为 1，避免死循环", () => {
    const { pageHeight, slices } = splitIntoPages(0, 2);

    expect(pageHeight).toBe(1);
    expect(slices).toEqual([
      { top: 0, height: 1 },
      { top: 1, height: 1 },
    ]);
  });
});
