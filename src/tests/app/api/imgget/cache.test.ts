import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  clearImageCache,
  getCachedImage,
  MAX_IMAGE_CACHE_ENTRIES,
  setCachedImage,
} from "@/app/api/imgget/cache";

const image = {
  data: new ArrayBuffer(1),
  contentType: "image/png",
};

beforeEach(() => {
  clearImageCache();
});

describe("imgget cache", () => {
  it("读取会刷新最近使用顺序", () => {
    for (let index = 0; index < MAX_IMAGE_CACHE_ENTRIES; index += 1) {
      setCachedImage(`https://fms.whalepea.com/${index}.png`, image);
    }

    expect(getCachedImage("https://fms.whalepea.com/0.png")).toBe(image);
    setCachedImage("https://fms.whalepea.com/new.png", image);

    expect(getCachedImage("https://fms.whalepea.com/0.png")).toBe(image);
    expect(getCachedImage("https://fms.whalepea.com/1.png")).toBeUndefined();
  });

  it("最多只保留 100 个图片地址", () => {
    for (let index = 0; index <= MAX_IMAGE_CACHE_ENTRIES; index += 1) {
      setCachedImage(`https://fms.whalepea.com/${index}.png`, image);
    }

    expect(getCachedImage("https://fms.whalepea.com/0.png")).toBeUndefined();
    expect(
      getCachedImage("https://fms.whalepea.com/100.png"),
    ).toBe(image);
  });
});
