import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { NextRequest } from "next/server";

import { POST } from "@/app/api/subjects/[subject]/route";
import { SUBJECTS } from "@/app/subjects/subjects";
import { jsonResponse, restoreFetch, stubFetch } from "@/tests/helpers/proxy";
import { loadSubjectPrompt } from "@/utils/prompts";

const HOST = "https://api.example.test/";

const contextFor = (subject: string) => ({
  params: Promise.resolve({ subject }),
});

const makeRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost/api/subjects/test`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("POST /api/subjects/[subject]", () => {
  it("未知学科返回 404，且不请求上游", async () => {
    const fetchMock = stubFetch(jsonResponse({ data: {} }));

    const res = await POST(makeRequest({ options: {} }), contextFor("unknown"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Unknown subject" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("把选项作为 config、src/prompts/<slug>.md 作为 prompt 发给 api/ai/subjects", async () => {
    const fetchMock = stubFetch(
      jsonResponse({ status: 200, data: '{"title":"口算练习卷","items":[]}' }),
    );

    const res = await POST(
      makeRequest({ options: { 年级: "三年级", 题目数量: "20" } }),
      contextFor("arithmetic"),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: '{"title":"口算练习卷","items":[]}',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HOST}api/ai/subjects`);

    const body = JSON.parse(String(init?.body));
    expect(body.config).toMatchObject({
      subject: "arithmetic",
      年级: "三年级",
      题目数量: "20",
    });
    expect(body.prompt).toBe(loadSubjectPrompt("arithmetic"));
    expect(body.prompt).toContain("口算练习");
    expect(body.actId).toBeUndefined();
    expect(body.systemPrompt).toBeUndefined();
  });

  it("只转发 x-user-id，不透传 connection / cookie 等客户端头", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "{}" }));

    await POST(
      makeRequest(
        { options: {} },
        {
          "x-user-id": "user-123",
          connection: "upgrade",
          cookie: "session=secret",
        },
      ),
      contextFor("words"),
    );

    const forwarded = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(forwarded.get("x-user-id")).toBe("user-123");
    expect(forwarded.has("connection")).toBe(false);
    expect(forwarded.has("cookie")).toBe(false);
  });

  it("上游 500 + body.status=404 时回传 message", async () => {
    stubFetch(
      jsonResponse(
        { status: 404, message: "config and prompt are required" },
        500,
      ),
    );

    const res = await POST(makeRequest({ options: {} }), contextFor("words"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "config and prompt are required",
    });
  });

  it("HTTP 200 但 body.status 不是 200 时按失败处理", async () => {
    stubFetch(jsonResponse({ status: 404, message: "Failed to get response" }));

    const res = await POST(makeRequest({ options: {} }), contextFor("words"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to get response" });
  });

  it("上游请求失败时返回 500", async () => {
    globalThis.fetch = jest
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(makeRequest({ options: {} }), contextFor("words"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal Server Error" });
  });
});

describe("学科配置与提示词", () => {
  it.each(SUBJECTS.map((subject) => subject.slug))(
    "%s 有对应的系统提示词，且包含标题与输出格式",
    (slug) => {
      const prompt = loadSubjectPrompt(slug);

      expect(prompt.startsWith("# ")).toBe(true);
      expect(prompt).toContain("## 输出格式");
      expect(prompt).toContain("items");
    },
  );

  it("每个学科的选项 key 不重复，且有默认值", () => {
    SUBJECTS.forEach((subject) => {
      const keys = subject.options.map((option) => option.key);
      expect(new Set(keys).size).toBe(keys.length);
      subject.options.forEach((option) => {
        expect(option.default).toBeDefined();
      });
    });
  });
});
