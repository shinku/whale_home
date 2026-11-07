import { describe, expect, it } from "@jest/globals";

import { SUBJECTS } from "@/app/subjects/subjects";

describe("SUBJECTS count selectors", () => {
  it("题目数量和页数统一使用 PageSelector", () => {
    const countOptions = SUBJECTS.flatMap((subject) =>
      subject.options.filter(
        (option) => option.key === "题目数量" || option.key === "页数",
      ),
    );

    expect(countOptions.length).toBeGreaterThan(0);
    for (const option of countOptions) {
      expect(option.type).toBe("page-selector");
      expect(option.unit).toBeTruthy();
      expect(option.choices?.length).toBeGreaterThan(0);
    }
  });
});

describe("SUBJECTS difficulty selectors", () => {
  it("难度统一使用 1~3 星选择器", () => {
    const difficultyOptions = SUBJECTS.flatMap((subject) =>
      subject.options.filter((option) => option.key === "难度"),
    );

    expect(difficultyOptions).toHaveLength(2);
    for (const option of difficultyOptions) {
      expect(option.type).toBe("difficulty-selector");
      expect(option.choices).toHaveLength(3);
      expect(option.choices).toContain(option.default);
    }
  });
});

describe("SUBJECTS translate direction", () => {
  it("使用英译中 / 中译英 Select，默认 en_to_zh", () => {
    const translate = SUBJECTS.find((subject) => subject.slug === "translate");
    const direction = translate?.options.find(
      (option) => option.key === "direction",
    );

    expect(direction).toMatchObject({
      type: "select",
      default: "en_to_zh",
      choices: ["en_to_zh", "zh_to_en"],
      choiceLabels: {
        en_to_zh: "英译中",
        zh_to_en: "中译英",
      },
    });
    expect(
      translate?.options.some((option) => option.key === "源语言"),
    ).toBe(false);
    expect(
      translate?.options.some((option) => option.key === "目标语言"),
    ).toBe(false);
    expect(
      translate?.options.some((option) => option.key === "文字"),
    ).toBe(false);
  });
});
