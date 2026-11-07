import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactElement } from "react";

import { SubjectDetailPage } from "@/app/subjects/components/SubjectDetailPage";
import { SUBJECTS, type TSubjectSlug } from "@/app/subjects/subjects";
import { jsonResponse, restoreFetch, stubFetch } from "@/tests/helpers/proxy";

const HOST = "https://api.example.test/";

/** 直接调用 server component 拿到的 React 元素，props 就是它内部传下去的参数 */
const propsOf = async (
  searchParams: Record<string, string | string[] | undefined>,
  slug: TSubjectSlug = "arithmetic",
) =>
  (
    (await SubjectDetailPage({
      slug,
      searchParams: Promise.resolve(searchParams),
    })) as ReactElement<Record<string, unknown>>
  ).props;

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("SubjectDetailPage", () => {
  it("按 requestid SSR 取数，把解析后的结果传给结果组件", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        status: 200,
        data: '{"title":"口算练习卷","items":[{"question":"1+1","answer":"2"}]}',
        requestid: "rid-1",
      }),
    );

    const props = await propsOf({ requestid: "rid-1" });

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${HOST}api/ai/subjects?requestid=rid-1`,
    );
    expect(props.result).toMatchObject({
      title: "口算练习卷",
      items: [{ question: "1+1", answer: "2" }],
    });
    expect(props.rawText).toBe("");
    expect((props.subject as { slug: string }).slug).toBe("arithmetic");
  });

  it("小程序 userId / openid 作为 x-user-id 传给上游", async () => {
    const fetchMock = stubFetch(
      jsonResponse({ status: 200, data: "{}", requestid: "rid-1" }),
    );

    const props = await propsOf({ requestid: "rid-1", openid: "oX-1" });

    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("x-user-id")).toBe("oX-1");
    expect(props.userId).toBe("oX-1");
  });

  it("缺少 requestid 时不请求上游，提示缺参数", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "{}" }));

    const props = await propsOf({});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(props.message).toBe("缺少 requestid，无法读取结果");
  });

  it("记录不存在 / 已过期时给出可读提示", async () => {
    stubFetch(
      jsonResponse({ status: 404, message: "subject is expired" }, 500),
    );

    const props = await propsOf({ requestid: "rid-1" });

    expect(props.message).toBe("结果不存在或已过期");
  });

  it("模型输出不是约定 JSON 时 result 为 null、rawText 兜底", async () => {
    stubFetch(
      jsonResponse({
        status: 200,
        data: "1. 守株__兔",
        requestid: "rid-1",
      }),
    );

    const props = await propsOf({ requestid: "rid-1" });

    expect(props.result).toBeNull();
    expect(props.rawText).toBe("1. 守株__兔");
  });
});

describe("detail 目录", () => {
  it.each(SUBJECTS.map((subject) => subject.slug))(
    "%s 目录下有 detail/page.tsx 且按 slug 渲染",
    (slug) => {
      const file = path.join(
        process.cwd(),
        "src",
        "app",
        "subjects",
        slug,
        "detail",
        "page.tsx",
      );

      expect(existsSync(file)).toBe(true);
      const source = readFileSync(file, "utf8");
      if (slug === "translate") {
        expect(source).toContain("getTranslateResultById");
        expect(source).toContain("TranslateCanvas");
      } else {
        expect(source).toContain(`slug="${slug}"`);
      }
    },
  );
});
