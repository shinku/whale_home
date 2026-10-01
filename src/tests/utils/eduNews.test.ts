import { describe, expect, it } from "@jest/globals";
import {
  EDU_NEWS_DEFAULT_LIMIT,
  EDU_NEWS_MAX_LIMIT,
  EDU_NEWS_MIN_LIMIT,
  formatTime,
  normalizeLimit,
} from "@/utils/eduNews";

describe("normalizeLimit", () => {
  it("不传时回退默认值 10", () => {
    expect(normalizeLimit()).toBe(EDU_NEWS_DEFAULT_LIMIT);
  });

  it("非数字 / NaN 回退默认值 10", () => {
    expect(normalizeLimit(Number.NaN)).toBe(EDU_NEWS_DEFAULT_LIMIT);
    expect(normalizeLimit("abc" as unknown as number)).toBe(
      EDU_NEWS_DEFAULT_LIMIT,
    );
  });

  it("小于下界时收敛到 1", () => {
    expect(normalizeLimit(0)).toBe(EDU_NEWS_MIN_LIMIT);
    expect(normalizeLimit(-5)).toBe(EDU_NEWS_MIN_LIMIT);
  });

  it("大于上界时收敛到 50（而不是回退成 10）", () => {
    expect(normalizeLimit(51)).toBe(EDU_NEWS_MAX_LIMIT);
    expect(normalizeLimit(9999)).toBe(EDU_NEWS_MAX_LIMIT);
  });

  it("小数向下取整，范围内原样返回", () => {
    expect(normalizeLimit(10.9)).toBe(10);
    expect(normalizeLimit(20)).toBe(20);
  });
});

describe("formatTime", () => {
  it("null / undefined / 非法值统一返回“时间未知”", () => {
    expect(formatTime(null)).toBe("时间未知");
    expect(formatTime(undefined)).toBe("时间未知");
    expect(formatTime("")).toBe("时间未知");
    expect(formatTime("not-a-date")).toBe("时间未知");
  });

  it("UTC 时间按 Asia/Shanghai 格式化", () => {
    expect(formatTime("2026-09-23T01:28:00.000Z")).toBe("2026/09/23 09:28");
  });

  it("跨天时正确进位到次日", () => {
    expect(formatTime("2026-09-22T16:00:00.000Z")).toBe("2026/09/23 00:00");
  });
});
