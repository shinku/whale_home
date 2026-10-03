import { describe, expect, it } from "@jest/globals";

import {
  itemOptions,
  parseSubjectResult,
  subjectResultToText,
  type TSubjectResult,
} from "@/app/subjects/result";

describe("parseSubjectResult", () => {
  it("直接解析对象", () => {
    const parsed = parseSubjectResult({
      title: "口算练习卷",
      subtitle: "三年级 · 中等 · 2 题",
      items: [{ question: "1 + 1 =", answer: "2" }],
    });

    expect(parsed?.title).toBe("口算练习卷");
    expect(parsed?.items).toHaveLength(1);
  });

  it("解析被 markdown 代码块包裹的 JSON 字符串", () => {
    const parsed = parseSubjectResult(
      '```json\n{"title":"字帖本","items":[{"pinyin":"bà","char":"坝"}]}\n```',
    );

    expect(parsed?.title).toBe("字帖本");
    expect(parsed?.items[0]).toEqual({ pinyin: "bà", char: "坝" });
  });

  it("前后有解释文字时截取第一个完整 JSON", () => {
    const parsed = parseSubjectResult(
      '好的，这是结果：{"title":"公式集","items":[]} 希望有帮助',
    );

    expect(parsed?.title).toBe("公式集");
    expect(parsed?.items).toEqual([]);
  });

  it("不是 JSON 时返回 null", () => {
    expect(parseSubjectResult("抱歉，我无法完成")).toBeNull();
    expect(parseSubjectResult(undefined)).toBeNull();
    expect(parseSubjectResult("[1,2,3]")).toBeNull();
  });

  it("items 里的非法元素会被过滤掉", () => {
    const parsed = parseSubjectResult({
      items: [{ a: 1 }, null, "x", 2],
    });

    expect(parsed?.items).toEqual([{ a: 1 }]);
  });
});

describe("subjectResultToText", () => {
  const result = (items: TSubjectResult["items"]): TSubjectResult => ({
    title: "标题",
    subtitle: "副标题",
    items,
  });

  it("口算：题号 + 算式 + 答案", () => {
    const text = subjectResultToText(
      "arithmetic",
      result([{ question: "37 + 58 =", answer: "95" }]),
      "口算练习卷",
    );

    expect(text).toContain("标题");
    expect(text).toContain("1. 37 + 58 = 95");
  });

  it("竖式：a op b = answer", () => {
    const text = subjectResultToText(
      "vertical",
      result([{ a: "63", b: "27", op: "−", answer: "36" }]),
      "竖式计算练习卷",
    );

    expect(text).toContain("1. 63 − 27 = 36");
  });

  it("成语：题干带选项，另起一行给答案", () => {
    const text = subjectResultToText(
      "idiom",
      result([{ stem: "守株待__", options: ["兔", "鸟"], answer: "兔" }]),
      "成语填空",
    );

    expect(text).toContain("1. 守株待__（兔 / 鸟）");
    expect(text).toContain("答案：兔");
  });

  it("背单词：拼写题没有选项时不输出括号", () => {
    const text = subjectResultToText(
      "words",
      result([{ prompt: "蜡笔", options: [], en: "crayon" }]),
      "单词练习",
    );

    expect(text).toContain("1. 蜡笔");
    expect(text).not.toContain("（");
  });

  it("itemOptions 只认字符串数组", () => {
    expect(itemOptions({ options: ["a", "b"] })).toEqual(["a", "b"]);
    expect(itemOptions({ options: [1, 2] })).toEqual(["1", "2"]);
    expect(itemOptions({ options: "a" })).toEqual([]);
  });
});
