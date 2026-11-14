import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { adminRequest } from "@/app/ddadmin/utils/adminRequest";
import { jsonResponse, restoreFetch, stubFetch } from "@/tests/helpers/proxy";

afterEach(() => {
  restoreFetch();
  jest.restoreAllMocks();
});

describe("adminRequest", () => {
  it("使用 Provider 传入的 openid 设置 x-user-id", async () => {
    const fetchMock = stubFetch(jsonResponse({ status: 200, data: [] }));

    await adminRequest("/api/admin/test", {}, "openid-from-provider");

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("x-user-id")).toBe("openid-from-provider");
    expect(headers.get("content-type")).toBe("application/json");
  });
});
