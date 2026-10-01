/** 教育新闻单条数据（GET /api/edu/news 返回的 data.list 元素） */
export interface EduNewsItem {
  /** 主键，可用于路由参数 */
  id: number;
  /** 新闻标题 */
  title: string;
  /** 正文，Markdown 格式，图片已是 OSS 绝对地址 */
  content: string;
  /** 来源，可能为空字符串 */
  source: string;
  /** 原文发稿时间，ISO-8601（UTC），可能为 null */
  publish_time: string | null;
  /** 分类，当前默认恒为“教育政策” */
  category: string;
  /** 原文链接 */
  url: string;
}

/** GET /api/edu/news 的完整响应体 */
export interface EduNewsListRes {
  status: number;
  data: {
    /** 本页条数，等于 list.length（不是总数） */
    count: number;
    list: EduNewsItem[];
  };
}
