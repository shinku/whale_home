import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { doRequest } from "@/app/ddadmin/utils/request";
import { jsonResponse, restoreFetch, stubFetch } from "@/tests/helpers/proxy";

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  restoreFetch();
  jest.restoreAllMocks();
});

describe("doRequest", () => {
  it("使用 Provider 传入的 openid", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: {} }));

    await doRequest("/api/admin/test", {}, "provider-openid");

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("x-user-id")).toBe("provider-openid");
  });

  it("没有 Provider openid 时拒绝请求", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: {} }));

    await expect(doRequest("/api/admin/test")).rejects.toThrow(
      "Missing admin openid",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
