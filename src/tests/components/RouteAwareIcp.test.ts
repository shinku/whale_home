import { describe, expect, it } from "@jest/globals";

import { shouldShowIcp } from "@/components/RouteAwareIcp";

describe("shouldShowIcp", () => {
  it.each([
    "/subjects",
    "/subjects/translate",
    "/subjects/translate/detail",
    "/agent",
    "/agent/history",
    "/act/123",
  ])("%s 不展示 ICP", (pathname) => {
    expect(shouldShowIcp(pathname)).toBe(false);
  });

  it.each(["/", "/edunews", "/news", "/ddadmin", "/subjects-other"])(
    "%s 继续展示 ICP",
    (pathname) => {
      expect(shouldShowIcp(pathname)).toBe(true);
    },
  );
});
