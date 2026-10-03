import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * 读取 src/prompts/<slug>.md —— 学科内容生成的系统提示词。
 * 通过 fs 读取而不是 import，方便直接改 md 文案、不用重新编译前端代码。
 */
const PROMPT_DIR = path.join(process.cwd(), "src", "prompts");

const cache = new Map<string, string>();

export const promptFilePath = (slug: string) =>
  path.join(PROMPT_DIR, `${slug}.md`);

export const loadSubjectPrompt = (slug: string): string => {
  const cached = cache.get(slug);
  if (cached) return cached;

  const content = readFileSync(promptFilePath(slug), "utf8");
  cache.set(slug, content);
  return content;
};
