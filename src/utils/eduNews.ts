import type { EduNewsItem, EduNewsListRes } from "@/types/eduNews";

/** 后端 limit 默认值 */
export const EDU_NEWS_DEFAULT_LIMIT = 10;
/** 后端只接受 1–50，前端自行保证（不要依赖后端兜底） */
export const EDU_NEWS_MIN_LIMIT = 1;
export const EDU_NEWS_MAX_LIMIT = 50;

/** 详情页来源标记：来自本项目（列表页点击进入） */
export const ENTRY_FROM_PROJECT = "project";
export const ENTRY_FROM_QUERY_KEY = "entryFrom";

/**
 * API 基地址，通过环境变量注入；默认走同源 /api（由通用代理路由转发到 getApiHost()）。
 * 例：NEXT_PUBLIC_API_BASE_URL=https://api.whalepea.com/api
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
  /\/+$/,
  "",
);

/** 把 limit 收敛到 1–50（非法值回退默认 10） */
export const normalizeLimit = (limit?: number): number => {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return EDU_NEWS_DEFAULT_LIMIT;
  }
  const value = Math.floor(limit);
  if (value < EDU_NEWS_MIN_LIMIT) return EDU_NEWS_MIN_LIMIT;
  if (value > EDU_NEWS_MAX_LIMIT) return EDU_NEWS_MAX_LIMIT;
  return value;
};

/**
 * 获取最新教育新闻。
 * 注意：接口没有分页能力，只能取“最新 N 条”，也没有 total / pageSize。
 * 错误响应不统一，这里只按 HTTP 状态码兜底，不解析 body.message。
 */
export const fetchEduNews = async (
  limit: number = EDU_NEWS_DEFAULT_LIMIT,
): Promise<EduNewsItem[]> => {
  const safeLimit = normalizeLimit(limit);
  const res = await fetch(`${API_BASE}/edu/news?limit=${safeLimit}`);
  if (!res.ok) {
    throw new Error(`获取教育新闻失败（HTTP ${res.status}）`);
  }
  const body = (await res.json()) as EduNewsListRes;
  return body?.data?.list ?? [];
};

/**
 * 按 id 获取单条新闻。
 * 后端目前没有单条详情接口（/api/edu/news/:id），只能在“最新 50 条”里查找，
 * 超出最新范围或已下架的记录会返回 null。
 */
export const fetchEduNewsById = async (
  id: number,
): Promise<EduNewsItem | null> => {
  if (!Number.isFinite(id)) return null;
  const list = await fetchEduNews(EDU_NEWS_MAX_LIMIT);
  return list.find((item) => item.id === id) ?? null;
};

/**
 * 格式化 publish_time（UTC 瞬时值）为 Asia/Shanghai 时间。
 * null / 非法值统一返回“时间未知”，避免 new Date(null) 之类的坑。
 */
export const formatTime = (publishTime?: string | null): string => {
  if (!publishTime) return "时间未知";
  const date = new Date(publishTime);
  if (Number.isNaN(date.getTime())) return "时间未知";
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}/${pick("month")}/${pick("day")} ${pick("hour")}:${pick("minute")}`;
};
