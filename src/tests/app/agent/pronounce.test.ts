import { describe, expect, it } from "@jest/globals";

import {
  getPronounceText,
  preparePronounceMarkdown,
} from "@/app/agent/pronounce";

describe("preparePronounceMarkdown", () => {
  it("把单词朗读标记转换成内部链接并保留 IPA", () => {
    expect(preparePronounceMarkdown("[pronounce:hero] /ˈhɪərəʊ/")).toBe(
      "[hero](pronounce:hero) /ˈhɪərəʊ/",
    );
  });

  it("正确编码含空格的英文短语", () => {
    expect(
      preparePronounceMarkdown("跟读：[pronounce:good morning] /ɡʊd ˈmɔːnɪŋ/"),
    ).toBe("跟读：[good morning](pronounce:good%20morning) /ɡʊd ˈmɔːnɪŋ/");
  });

  it("支持同一段 Markdown 中多个朗读标记", () => {
    expect(
      preparePronounceMarkdown(
        "[pronounce:apple] /ˈæpəl/ 和 [pronounce:good job] /ɡʊd dʒɒb/",
      ),
    ).toBe(
      "[apple](pronounce:apple) /ˈæpəl/ 和 [good job](pronounce:good%20job) /ɡʊd dʒɒb/",
    );
  });

  it("支持包含标点的完整长句", () => {
    const sentence =
      "Although it was raining heavily outside, the students still finished their group project and presented it to the class.";

    expect(preparePronounceMarkdown(`[pronounce:${sentence}] /ɔːlˈðəʊ/`)).toBe(
      `[${sentence}](pronounce:${encodeURIComponent(sentence)}) /ɔːlˈðəʊ/`,
    );
  });
});

describe("getPronounceText", () => {
  it("从内部链接还原英文内容", () => {
    expect(getPronounceText("pronounce:good%20morning")).toBe("good morning");
    expect(getPronounceText("https://example.com")).toBeNull();
  });
});
