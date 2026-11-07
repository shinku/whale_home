import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { GET, POST } from "@/app/api/imgget/route";
import { clearImageCache } from "@/app/api/imgget/cache";
import {
  jsonResponse,
  makeRequest,
  restoreFetch,
  stubFetch,
} from "@/tests/helpers/proxy";

const IMAGE_URL =
  "https://fms.whalepea.com/pub/ai-translate/example.png";

const imageResponse = () =>
  new Response(new Uint8Array([137, 80, 78, 71]), {
    status: 200,
    headers: { "Content-Type": "image/png" },
  });

afterEach(() => {
  clearImageCache();
  restoreFetch();
  jest.restoreAllMocks();
});

describe("/api/imgget", () => {
  it("按 URL 下载图片并返回二进制内容", async () => {
    const fetchMock = stubFetch(imageResponse());

    const response = await GET(
      makeRequest(`/api/imgget?url=${encodeURIComponent(IMAGE_URL)}`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([
      137, 80, 78, 71,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      IMAGE_URL,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("相同图片地址命中内部缓存，不重复请求", async () => {
    const fetchMock = stubFetch(imageResponse());

    await GET(
      makeRequest(`/api/imgget?url=${encodeURIComponent(IMAGE_URL)}`),
    );
    await GET(
      makeRequest(`/api/imgget?url=${encodeURIComponent(IMAGE_URL)}`),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("兼容 POST body 传 url", async () => {
    const fetchMock = stubFetch(imageResponse());

    const response = await POST(
      makeRequest("/api/imgget", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: IMAGE_URL }),
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("拒绝非 whalepea 图片地址", async () => {
    const fetchMock = stubFetch(imageResponse());

    const response = await GET(
      makeRequest(
        `/api/imgget?url=${encodeURIComponent("https://example.com/a.png")}`,
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "图片地址无效" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("远端不是图片时返回 502", async () => {
    stubFetch(jsonResponse({ ok: true }));
    jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(
      makeRequest(`/api/imgget?url=${encodeURIComponent(IMAGE_URL)}`),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "远端内容不是图片" });
  });
});
