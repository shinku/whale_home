import { describe, expect, it } from "@jest/globals";

import { toQuerySuffix } from "@/app/subjects/page";

describe("toQuerySuffix", () => {
  it("没有参数时返回空串", () => {
    expect(toQuerySuffix({})).toBe("");
  });

  it("把 userId / openid 原样带过去", () => {
    expect(toQuerySuffix({ userId: "abc", openid: "oX" })).toBe(
      "?userId=abc&openid=oX",
    );
  });

  it("同名数组参数重复出现", () => {
    expect(toQuerySuffix({ tag: ["a", "b"] })).toBe("?tag=a&tag=b");
  });

  it("忽略 undefined，保留空串", () => {
    expect(toQuerySuffix({ a: undefined, b: "" })).toBe("?b=");
  });

  it("特殊字符做 URL 编码", () => {
    expect(toQuerySuffix({ u: "a b&c" })).toBe("?u=a+b%26c");
  });
});
