type TQuestionMessage = {
  role: "user" | "assistant";
  content: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** 取某条回答之前最近的一次文本提问。 */
export const findRecentQuestion = (
  messages: readonly TQuestionMessage[],
  assistantIndex: number,
) => {
  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const content = message?.role === "user" ? message.content.trim() : "";
    if (content) return content;
  }
  return "";
};

/**
 * 把用户提问放到导出 HTML 的头部。提问来自用户输入，必须转义后再拼接。
 * 转换接口会直接用 setContent() 渲染，因此字体等样式需要在导出 HTML 中内联。
 */
export const prependQuestionHtml = (question: string, bodyHtml: string) => {
  const content = question.trim();
  if (!content) return bodyHtml;

  return (
    `<section style="box-sizing:border-box;margin:0 0 16px;padding:12px;` +
    `border:1px solid #bfdbfe;border-radius:8px;background-color:#eff6ff;` +
    `color:#1e3a8a;font-size:12px;line-height:1.6;word-break:break-word;` +
    `break-inside:avoid;page-break-inside:avoid;">` +
    `<div style="margin-bottom:4px;font-size:12px;font-weight:600;">` +
    `最近一次提问</div>` +
    `<div style="font-size:12px;white-space:pre-wrap;">${escapeHtml(content)}</div>` +
    `</section>${bodyHtml}`
  );
};
