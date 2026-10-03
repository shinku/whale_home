import type { TSubjectSlug } from "./subjects";

/** AI 返回的单条内容，字段随学科而定（见 src/prompts/<slug>.md 的输出格式） */
export type TSubjectItem = Record<string, unknown>;

export type TSubjectResult = {
  title?: string;
  subtitle?: string;
  mode?: string;
  type?: string;
  sourceLang?: string;
  targetLang?: string;
  items: TSubjectItem[];
};

const asText = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);

const asList = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => asText(item)) : [];

/**
 * 解析 AI 返回的内容：模型可能直接返回对象、字符串，或被 ```json 包裹的字符串。
 * 解析失败返回 null，由调用方决定回退展示（例如直接显示原始文本）。
 */
export const parseSubjectResult = (raw: unknown): TSubjectResult | null => {
  let value = raw;

  if (typeof value === "string") {
    const trimmed = value
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      value = JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const items = record.items;

  return {
    title: asText(record.title) || undefined,
    subtitle: asText(record.subtitle) || undefined,
    mode: asText(record.mode) || undefined,
    type: asText(record.type) || undefined,
    sourceLang: asText(record.sourceLang) || undefined,
    targetLang: asText(record.targetLang) || undefined,
    items: Array.isArray(items)
      ? items.filter((item): item is TSubjectItem =>
          Boolean(item && typeof item === "object"),
        )
      : [],
  };
};

/** 取字符串数组字段（例如选择题的 options） */
export const itemOptions = (item: TSubjectItem, key = "options") =>
  asList(item[key]);

export const itemText = (item: TSubjectItem, key: string) => asText(item[key]);

/**
 * 把结果拍平成纯文本，用于「保存为 Word」（后端 text_2_word 接口吃纯文本）。
 * 每个学科的排列方式与卷面展示保持一致。
 */
export const subjectResultToText = (
  slug: TSubjectSlug,
  result: TSubjectResult,
  fallbackTitle: string,
): string => {
  const lines: string[] = [result.title || fallbackTitle];
  if (result.subtitle) lines.push(result.subtitle);
  lines.push("");

  result.items.forEach((item, index) => {
    const no = index + 1;
    switch (slug) {
      case "arithmetic":
        lines.push(
          `${no}. ${itemText(item, "question")} ${itemText(item, "answer")}`,
        );
        break;
      case "vertical":
        lines.push(
          `${no}. ${itemText(item, "a")} ${itemText(item, "op")} ${itemText(item, "b")} = ${itemText(item, "answer")}`,
        );
        break;
      case "copybook":
        lines.push(
          `${no}. ${itemText(item, "pinyin")}　${itemText(item, "char")}`,
        );
        break;
      case "idiom":
        lines.push(
          `${no}. ${itemText(item, "stem")}（${itemOptions(item).join(" / ")}）`,
        );
        lines.push(`   答案：${itemText(item, "answer")}`);
        break;
      case "translate":
        lines.push(`${no}. ${itemText(item, "source")}`);
        lines.push(`   ${itemText(item, "target")}`);
        break;
      case "formula":
        lines.push(
          `${no}. ${itemText(item, "name")}　${itemText(item, "expr")}`,
        );
        break;
      case "words": {
        const options = itemOptions(item);
        lines.push(
          `${no}. ${itemText(item, "prompt")}${options.length ? `（${options.join(" / ")}）` : ""}`,
        );
        break;
      }
      default:
        lines.push(`${no}. ${JSON.stringify(item)}`);
    }
  });

  return lines.join("\n");
};
