"use client";

import { useEffect, useState } from "react";
import type { EduNewsItem } from "@/types/eduNews";
import {
  EDU_NEWS_MAX_LIMIT,
  fetchEduNewsById,
  formatTime,
} from "@/utils/eduNews";
import { BackButton } from "./BackButton";
import { MarkdownContent } from "./MarkdownContent";

type NewsDetailProps = {
  id: string;
  entryFrom?: string;
};

/** 详情页容器：按 id 加载并预览 Markdown 正文 */
export const NewsDetail = ({ id, entryFrom }: NewsDetailProps) => {
  const [item, setItem] = useState<EduNewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEduNewsById(Number(id));
        if (!cancelled) setItem(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <article>
      <BackButton entryFrom={entryFrom} />

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">加载中…</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-600">{error}</div>
      ) : !item ? (
        <div className="py-10 text-center text-sm text-gray-400">
          未找到该新闻（可能已下架，或不在最新 {EDU_NEWS_MAX_LIMIT} 条内）
        </div>
      ) : (
        <>
          <h1 className="text-xl font-bold leading-normal mb-3 text-gray-900">
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 mb-4 pb-4 border-b border-gray-200 text-xs text-gray-400">
            {item.source ? <span>{item.source}</span> : null}
            <span>{formatTime(item.publish_time)}</span>
            {item.category ? (
              <span className="inline-block px-2 py-px rounded-[10px] bg-blue-50 text-blue-600 text-xs">
                {item.category}
              </span>
            ) : null}
          </div>

          <MarkdownContent content={item.content} />

          {item.url ? (
            <a
              className="inline-block mt-6 text-blue-600 text-sm"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看原文
            </a>
          ) : null}
        </>
      )}
    </article>
  );
};
