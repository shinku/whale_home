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
  it("map 里配置了 html2pdf / html2doc，分别指向上游的 html_to_pdf / html_to_doc", () => {
    expect(CONVERTERS.html2pdf.path).toBe("api/file/html_to_pdf");
    expect(CONVERTERS.html2doc.path).toBe("api/file/html_to_doc");
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

    const res = await POST(makeConvertRequest({ html: "<p>hi</p>" }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("html2pdf：把 html 与 PDF 选项发给上游，并透传 x-user-id", async () => {
    const fetchMock = stubFetch(
      jsonResponse({ status: 200, data: "pub/1728381842163_42.7.pdf" }),
    );

    const res = await POST(
      makeConvertRequest(
        {
          convertType: "html2pdf",
          html: "<div style='color:red'>卷面</div>",
          printBackground: true,
        },
        { "x-user-id": "user-123" },
      ),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: "pub/1728381842163_42.7.pdf" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HOST}api/file/html_to_pdf`);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("x-user-id")).toBe("user-123");
    expect(JSON.parse(String(init?.body))).toEqual({
      html: "<div style='color:red'>卷面</div>",
      format: "A4",
      landscape: false,
      print_background: true,
    });
  });

  it("html2pdf：print_background 只有显式传 false 才关闭，format 可按需覆盖", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    await POST(
      makeConvertRequest({
        convertType: "html2pdf",
        html: "<p>x</p>",
        printBackground: false,
        format: "A3",
        landscape: true,
      }),
    );

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      html: "<p>x</p>",
      format: "A3",
      landscape: true,
      print_background: false,
    });
  });

  it("html2doc：把 html 与 toStrategy 发给上游", async () => {
    const fetchMock = stubFetch(
      jsonResponse({ status: 200, data: "pub/1728381842163_42.7.docx" }),
    );

    const res = await POST(
      makeConvertRequest(
        {
          convertType: "html2doc",
          html: "<h1>标题</h1>",
          toStrategy: "pdfkit-convert",
        },
        { "x-user-id": "user-123" },
      ),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      data: "pub/1728381842163_42.7.docx",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HOST}api/file/html_to_doc`);
    expect(new Headers(init?.headers).get("x-user-id")).toBe("user-123");
    expect(JSON.parse(String(init?.body))).toEqual({
      html: "<h1>标题</h1>",
      toStrategy: "pdfkit-convert",
    });
  });

  it("html2doc：不传 toStrategy 时默认 pdfkit-convert，传了的值原样透传", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    await POST(
      makeConvertRequest({ convertType: "html2doc", html: "<p>x</p>" }),
    );
    await POST(
      makeConvertRequest({
        convertType: "html2doc",
        html: "<p>x</p>",
        toStrategy: "regural",
      }),
    );

    expect(
      fetchMock.mock.calls.map(
        (call) => JSON.parse(String(call[1]?.body)).toStrategy,
      ),
    ).toEqual(["pdfkit-convert", "regural"]);
  });

  it("html2pdf：不带 html2doc 的 toStrategy", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    await POST(
      makeConvertRequest({
        convertType: "html2pdf",
        html: "<p>x</p>",
        toStrategy: "pdfkit-convert",
      }),
    );

    expect(
      JSON.parse(String(fetchMock.mock.calls[0][1]?.body)),
    ).not.toHaveProperty("toStrategy");
  });

  it("html 不是字符串时按空串发给上游（由上游报 html is empty）", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    await POST(makeConvertRequest({ convertType: "html2doc", html: 123 }));

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      html: "",
      toStrategy: "pdfkit-convert",
    });
  });

  it("没有 x-user-id 时不带该头（由上游返回 userId is required）", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: "x" }));

    await POST(
      makeConvertRequest({ convertType: "html2doc", html: "<p>x</p>" }),
    );

    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("x-user-id"),
    ).toBeNull();
  });

  it("上游 HTTP 500 / body.status 404 时回传上游 message", async () => {
    stubFetch(
      jsonResponse(
        { status: 404, message: "count_convert_file_limit_is_used_up" },
        500,
      ),
    );

    const res = await POST(
      makeConvertRequest({ convertType: "html2pdf", html: "<p>x</p>" }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "count_convert_file_limit_is_used_up",
    });
  });

  it("上游报错但没有 message 时给兜底文案", async () => {
    stubFetch(jsonResponse({ status: 404 }, 500));

    const res = await POST(
      makeConvertRequest({ convertType: "html2doc", html: "<p>x</p>" }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "转换失败，请稍后重试" });
  });

  it("上游 body.status 不是 200（HTTP 200）也算失败", async () => {
    stubFetch(jsonResponse({ status: 404, message: "html is empty" }));

    const res = await POST(
      makeConvertRequest({ convertType: "html2pdf", html: "<p>x</p>" }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "html is empty" });
  });

  it("fetch 抛错时返回 500", async () => {
    stubFetchReject(new Error("boom"));

    const res = await POST(
      makeConvertRequest({ convertType: "html2doc", html: "<p>x</p>" }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal Server Error" });
  });
});
