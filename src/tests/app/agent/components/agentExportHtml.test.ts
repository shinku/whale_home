import { describe, expect, it } from "@jest/globals";

import {
  findRecentQuestion,
  prependQuestionHtml,
} from "@/app/agent/components/agentExportHtml";

describe("findRecentQuestion", () => {
  it("优先取回答之前最近的一次用户文本提问", () => {
    const messages = [
      { role: "user" as const, content: "第一个问题" },
      { role: "assistant" as const, content: "第一个回答" },
      { role: "user" as const, content: "  最近一次提问  " },
      { role: "assistant" as const, content: "当前回答" },
    ];

    expect(findRecentQuestion(messages, 3)).toBe("最近一次提问");
  });

  it("跳过图片等没有文本的用户消息", () => {
    const messages = [
      { role: "user" as const, content: "之前的问题" },
      { role: "assistant" as const, content: "之前的回答" },
      { role: "user" as const, content: "  " },
      { role: "assistant" as const, content: "当前回答" },
    ];

    expect(findRecentQuestion(messages, 3)).toBe("之前的问题");
  });
});

describe("prependQuestionHtml", () => {
  it("把安全转义后的 12px 提问 HTML 放在导出内容头部", () => {
    const html = prependQuestionHtml(
      '比较 <script>alert("x")</script> 与 A&B',
      '<div id="answer">回答</div>',
    );

    expect(html).toContain("最近一次提问");
    expect(html).toContain("font-size:12px");
    expect(html).toContain(
      "比较 &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; 与 A&amp;B",
    );
    expect(html.indexOf("最近一次提问")).toBeLessThan(
      html.indexOf('<div id="answer">'),
    );
  });

  it("没有提问时不改变导出内容", () => {
    const body = '<div id="answer">回答</div>';
    expect(prependQuestionHtml("  ", body)).toBe(body);
  });
});
