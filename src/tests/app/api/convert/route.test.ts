import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { CONVERTERS, POST } from "@/app/api/convert/route";
import {
  HOST,
  jsonResponse,
  makeRequest,
  restoreFetch,
  stubFetch,
  stubFetchReject,
} from "@/tests/helpers/proxy";

const makeConvertRequest = (
  body: unknown,
  headers: Record<string, string> = {},
) =>
  makeRequest("/api/convert", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("POST /api/convert", () => {
  it("map 里配置了 base642pdf，指向上游 /api/file/base64_to_pdf", () => {
    expect(CONVERTERS.base642pdf.path).toBe("api/file/base64_to_pdf");
  });

  it("未知 convertType 返回 400，且不请求上游", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    const res = await POST(makeConvertRequest({ convertType: "unknown" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Unknown convertType" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("缺少 convertType 返回 400，且不请求上游", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    const res = await POST(makeConvertRequest({ base64List: ["a"] }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("base642pdf：把 base64List 转成 base64_list 发给上游，并透传 x-user-id", async () => {
    const fetchMock = stubFetch(
      jsonResponse({ status: 200, data: "pub/1728381842163_42.7.pdf" }),
    );

    const res = await POST(
      makeConvertRequest(
        {
          convertType: "base642pdf",
          base64List: ["data:image/png;base64,AAA", "BBB"],
        },
        { "x-user-id": "user-123" },
      ),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: "pub/1728381842163_42.7.pdf" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HOST}api/file/base64_to_pdf`);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("x-user-id")).toBe("user-123");
    expect(JSON.parse(String(init?.body))).toEqual({
      base64_list: ["data:image/png;base64,AAA", "BBB"],
    });
  });

  it("没有 x-user-id 时不带该头（由上游返回 userId is required）", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    await POST(
      makeConvertRequest({ convertType: "base642pdf", base64List: [] }),
    );

    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("x-user-id"),
    ).toBeNull();
  });

  it("base64List 不是数组时按空数组发给上游", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    await POST(
      makeConvertRequest({
        convertType: "base642pdf",
        base64List: "not-array",
      }),
    );

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      base64_list: [],
    });
  });

  it("上游 HTTP 500 / body.status 404 时回传上游 message", async () => {
    stubFetch(
      jsonResponse({ status: 404, message: "余额不足，请充值后再使用" }, 500),
    );

    const res = await POST(
      makeConvertRequest({ convertType: "base642pdf", base64List: ["a"] }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "余额不足，请充值后再使用" });
  });

  it("上游报错但没有 message 时给兜底文案", async () => {
    stubFetch(jsonResponse({ status: 404 }, 500));

    const res = await POST(
      makeConvertRequest({ convertType: "base642pdf", base64List: [] }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "转换失败，请稍后重试" });
  });

  it("上游 body.status 不是 200（HTTP 200）也算失败", async () => {
    stubFetch(jsonResponse({ status: 404, message: "base64_list is empty" }));

    const res = await POST(
      makeConvertRequest({ convertType: "base642pdf", base64List: [] }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "base64_list is empty" });
  });

  it("fetch 抛错时返回 500", async () => {
    stubFetchReject(new Error("boom"));

    const res = await POST(
      makeConvertRequest({ convertType: "base642pdf", base64List: [] }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal Server Error" });
  });
});
