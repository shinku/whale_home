const PRONOUNCE_PREFIX = "pronounce:";
const MAX_PRONOUNCE_TEXT_LENGTH = 1000;

/** 把 Agent 返回的朗读标记转成 Markdown 内部链接。 */
export const preparePronounceMarkdown = (markdown: string) =>
  markdown.replace(
    new RegExp(
      `\\[pronounce:([^\\]\\r\\n]{1,${MAX_PRONOUNCE_TEXT_LENGTH}})\\]`,
      "g",
    ),
    (_match, text: string) =>
      `[${text}](${PRONOUNCE_PREFIX}${encodeURIComponent(text)})`,
  );

/** 从内部朗读链接中安全还原英文文本。 */
export const getPronounceText = (href: string) => {
  if (!href.startsWith(PRONOUNCE_PREFIX)) return null;

  const encoded = href.slice(PRONOUNCE_PREFIX.length);
  try {
    return decodeURIComponent(encoded).trim();
  } catch {
    return encoded.trim();
  }
};
