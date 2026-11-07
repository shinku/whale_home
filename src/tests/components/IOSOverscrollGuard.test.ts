import { describe, expect, it } from "@jest/globals";

import { shouldBlockDocumentOverscroll } from "@/components/IOSOverscrollGuard";

const base = {
  scrollHeight: 1200,
  viewportHeight: 800,
};

describe("shouldBlockDocumentOverscroll", () => {
  it("页面顶部继续向下拖时阻止", () => {
    expect(
      shouldBlockDocumentOverscroll({
        ...base,
        scrollTop: 0,
        deltaY: 20,
      }),
    ).toBe(true);
  });

  it("页面底部继续向上拖时阻止", () => {
    expect(
      shouldBlockDocumentOverscroll({
        ...base,
        scrollTop: 400,
        deltaY: -20,
      }),
    ).toBe(true);
  });

  it("页面中间正常滚动时不阻止", () => {
    expect(
      shouldBlockDocumentOverscroll({
        ...base,
        scrollTop: 200,
        deltaY: 20,
      }),
    ).toBe(false);
    expect(
      shouldBlockDocumentOverscroll({
        ...base,
        scrollTop: 200,
        deltaY: -20,
      }),
    ).toBe(false);
  });
});
