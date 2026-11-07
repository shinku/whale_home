import { describe, expect, it } from "@jest/globals";

import {
  PAGE_SELECTOR_ITEM_HEIGHT,
  pageSelectorIndexAtOffset,
} from "@/components/PageSelector";

describe("pageSelectorIndexAtOffset", () => {
  it("按 40px 行高取最近选项", () => {
    expect(pageSelectorIndexAtOffset(0, 10)).toBe(0);
    expect(pageSelectorIndexAtOffset(19, 10)).toBe(0);
    expect(pageSelectorIndexAtOffset(20, 10)).toBe(1);
    expect(pageSelectorIndexAtOffset(119, 10)).toBe(3);
  });

  it("限制在有效下标范围内", () => {
    expect(pageSelectorIndexAtOffset(-100, 10)).toBe(0);
    expect(pageSelectorIndexAtOffset(10_000, 10)).toBe(9);
    expect(pageSelectorIndexAtOffset(100, 0)).toBe(0);
  });

  it("行高与参考稿保持一致", () => {
    expect(PAGE_SELECTOR_ITEM_HEIGHT).toBe(40);
  });
});
