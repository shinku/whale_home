import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { GET } from "@/app/api/ai/subject/translate/[id]/route";
import {
  HOST,
  jsonResponse,
  makeRequest,
  restoreFetch,
  stubFetch,
} from "@/tests/helpers/proxy";

const contextFor = (id: string) => ({ params: Promise.resolve({ id }) });

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("GET /api/ai/subject/translate/[id]", () => {
  it("按 id 读取结果并转发 x-user-id", async () => {
    const data = {
      source: "data:image/png;base64,abc",
      result: [
        {
          message: "你好",
          rect: { x: 1, y: 2, w: 30, h: 10 },
          color: "#333333",
          background: "#ffffff",
          fontSize: 20,
        },
      ],
      direction: "en_to_zh",
      imageWidth: 1920,
      imageHeight: 1080,
    };
    const fetchMock = stubFetch(
      jsonResponse({ status: 200, data, id: "translate-id-1" }),
    );

    const response = await GET(
      makeRequest("/api/ai/subject/translate/translate-id-1", {
        headers: { "x-user-id": "openid-1" },
      }),
      contextFor("translate-id-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 200,
      data,
      id: "translate-id-1",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `${HOST}api/ai/subject/translate/translate-id-1`,
    );
    expect(new Headers(init?.headers).get("x-user-id")).toBe("openid-1");
  });

  it("原样回传 404 / 410 业务错误", async () => {
    stubFetch(jsonResponse({ status: 410, message: "翻译结果已过期" }, 410));

    const response = await GET(
      makeRequest("/api/ai/subject/translate/expired-id"),
      contextFor("expired-id"),
    );

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: "翻译结果已过期" });
  });

  it("为 source 对象路径补全 fms 域名", async () => {
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

    const response = await GET(
      makeRequest("/api/ai/subject/translate/translate-id-2"),
      contextFor("translate-id-2"),
    );

    expect(await response.json()).toMatchObject({
      data: {
        source:
          "https://fms.whalepea.com/pub/ai-translate/result.png",
      },
    });
  });

  it("缺少 id 时不请求上游", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: {} }));

    const response = await GET(
      makeRequest("/api/ai/subject/translate/"),
      contextFor(""),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "缺少翻译结果 id" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
