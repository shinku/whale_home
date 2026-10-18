import { describe, expect, it } from "@jest/globals";

import {
  EXPORT_STYLE_PROPERTIES,
  serializeStyles,
} from "@/app/subjects/components/paperToHtml";

describe("EXPORT_STYLE_PROPERTIES", () => {
  it("覆盖卷面用到的关键属性", () => {
    for (const property of [
      "display",
      "font-size",
      "font-family",
      "letter-spacing",
      "line-height",
      "text-align",
      "color",
      "width",
      "padding-left",
      "border-left-style",
      "border-bottom-left-radius",
      "background-color",
      "column-count",
      "grid-template-columns",
      "break-inside",
      "position",
      "transform",
    ]) {
      expect(EXPORT_STYLE_PROPERTIES).toContain(property);
    }
  });

  it("没有重复属性", () => {
    expect(new Set(EXPORT_STYLE_PROPERTIES).size).toBe(
      EXPORT_STYLE_PROPERTIES.length,
    );
  });
});

describe("serializeStyles", () => {
  it("按白名单拼接成 style 值，空值跳过", () => {
    const css = serializeStyles((property) => {
      if (property === "display") return "flex";
      if (property === "font-size") return "15px";
      return "";
    });

    expect(css).toBe("font-size:15px;display:flex");
  });

  it("只读取白名单里的属性", () => {
    const asked: string[] = [];
    serializeStyles((property) => {
      asked.push(property);
      return "";
    });

    expect(asked).toEqual([...EXPORT_STYLE_PROPERTIES]);
    expect(asked).not.toContain("--tw-shadow");
  });

  it("全为空时返回空串", () => {
    expect(serializeStyles(() => "")).toBe("");
  });
});
