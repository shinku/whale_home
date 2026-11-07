import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { getTranslateResultById } from "@/app/subjects/translate/service";
import {
  HOST,
  jsonResponse,
  restoreFetch,
  stubFetch,
} from "@/tests/helpers/proxy";

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("getTranslateResultById", () => {
  it("按 id 读取并清洗结果，同时转发用户身份", async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        status: 200,
        data: {
          source: "data:image/png;base64,abc",
          result: [
            {
              message: "你好",
              rect: { x: 1, y: 2, w: 30, h: 10 },
              color: "#112233",
              background: "#f0f1f2",
              fontSize: 18,
            },
            {
              message: "",
              rect: { x: 0, y: 0, w: 1, h: 1 },
              color: "#333333",
              background: "#ffffff",
            },
          ],
          direction: "en_to_zh",
          imageWidth: 1920,
          imageHeight: 1080,
        },
        id: "translate-id-1",
      }),
    );

    const result = await getTranslateResultById({
      id: "translate-id-1",
      userId: "openid-1",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        source: "data:image/png;base64,abc",
        result: [
          {
            message: "你好",
            rect: { x: 1, y: 2, w: 30, h: 10 },
            color: "#112233",
            background: "#f0f1f2",
            fontSize: 18,
          },
        ],
        id: "translate-id-1",
        direction: "en_to_zh",
        imageWidth: 1920,
        imageHeight: 1080,
      },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${HOST}api/ai/subject/translate/translate-id-1`);
    expect(new Headers(init?.headers).get("x-user-id")).toBe("openid-1");
  });

  it("回传 410 过期错误", async () => {
    stubFetch(jsonResponse({ status: 410, message: "翻译结果已过期" }, 410));

    await expect(
      getTranslateResultById({ id: "expired-id" }),
    ).resolves.toEqual({
      ok: false,
      error: "翻译结果已过期",
      status: 410,
    });
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

    const result = await getTranslateResultById({ id: "translate-id-2" });

    expect(result).toMatchObject({
      ok: true,
      data: {
        source:
          "https://fms.whalepea.com/pub/ai-translate/result.png",
      },
    });
  });
});
