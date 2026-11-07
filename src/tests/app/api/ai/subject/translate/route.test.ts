import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { POST } from "@/app/api/ai/subject/translate/route";
import {
  HOST,
  jsonResponse,
  makeRequest,
  restoreFetch,
  stubFetch,
  stubFetchReject,
} from "@/tests/helpers/proxy";

const IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";

const requestFor = (body: unknown, headers: Record<string, string> = {}) =>
  makeRequest("/api/ai/subject/translate", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("POST /api/ai/subject/translate", () => {
  it("转发 Base64 图片和 x-user-id，并返回翻译结果与 id", async () => {
    const blocks = [
      {
        message: "你好",
        rect: { x: 10, y: 20, w: 100, h: 24 },
        color: "#333333",
        background: "#ffffff",
        fontSize: 20,
      },
    ];
    const data = {
      source: IMAGE,
      result: blocks,
      direction: "en_to_zh",
      imageWidth: 1920,
      imageHeight: 1080,
    };
    const fetchMock = stubFetch(
      jsonResponse({ status: 200, data, id: "translate-id-1" }),
    );

    const response = await POST(
      requestFor({ source: IMAGE }, { "x-user-id": "openid-1" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 200,
      data,
      id: "translate-id-1",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HOST}api/ai/subject/translate`);
    expect(new Headers(init?.headers).get("x-user-id")).toBe("openid-1");
    expect(JSON.parse(String(init?.body))).toEqual({
      source: IMAGE,
      direction: "en_to_zh",
    });
  });

  it("兼容 imageBase64 / image 字段并统一转发为 source", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        status: 200,
        data: { source: IMAGE, result: [] },
        id: "translate-id-1",
      }),
    );

    await POST(requestFor({ imageBase64: IMAGE }));
    await POST(requestFor({ image: IMAGE }));

    expect(
      fetchMock.mock.calls.map((call) => JSON.parse(String(call[1]?.body))),
    ).toEqual([
      { source: IMAGE, direction: "en_to_zh" },
      { source: IMAGE, direction: "en_to_zh" },
    ]);
  });

  it("返回前为 source 对象路径补全 fms 域名", async () => {
    stubFetch(
      jsonResponse({
        status: 200,
        data: {
          source: "pub/ai-translate/result.png",
          result: [],
        },
        id: "translate-id-2",
      }),
    );

    const response = await POST(requestFor({ source: IMAGE }));

    expect(await response.json()).toMatchObject({
      data: {
        source:
          "https://fms.whalepea.com/pub/ai-translate/result.png",
      },
    });
  });

  it("透传中译英方向，非法值回退英译中", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        status: 200,
        data: { source: IMAGE, result: [] },
        id: "translate-id-1",
      }),
    );

    await POST(requestFor({ source: IMAGE, direction: "zh_to_en" }));
    await POST(requestFor({ source: IMAGE, direction: "invalid" }));

    expect(
      fetchMock.mock.calls.map((call) =>
        JSON.parse(String(call[1]?.body)).direction,
      ),
    ).toEqual(["zh_to_en", "en_to_zh"]);
  });

  it("没有图片时不请求上游", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: [] }));

    const response = await POST(requestFor({ source: "" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "请上传需要翻译的图片",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("拒绝公网图片 URL", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: [] }));

    const response = await POST(
      requestFor({ source: "https://example.com/a.png" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "只支持 Base64 图片" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("回传上游错误状态和信息", async () => {
    stubFetch(
      jsonResponse({ status: 403, message: "当前会员已过期，请先续费" }, 403),
    );

    const response = await POST(requestFor({ source: IMAGE }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "当前会员已过期，请先续费",
    });
  });

  it("上游 data 不是数组时按失败处理", async () => {
    stubFetch(
      jsonResponse({
        status: 200,
        data: { message: "invalid" },
        id: "translate-id-1",
      }),
    );

    const response = await POST(requestFor({ source: IMAGE }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "图片翻译失败，请稍后重试",
    });
  });

  it("上游请求失败时返回 500", async () => {
    stubFetchReject(new Error("network down"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(requestFor({ source: IMAGE }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "图片翻译失败，请稍后重试",
    });
  });
});
