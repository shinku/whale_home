"use client";

import { useCallback, useEffect, useState } from "react";
import type { EduNewsItem } from "@/types/eduNews";
import { EDU_NEWS_DEFAULT_LIMIT, fetchEduNews } from "@/utils/eduNews";
import { NewsItemList } from "./NewsItemList";

/** 列表页容器：拉取“最新 N 条”（接口没有分页，只能取最新） */
export const NewsList = () => {
  const [items, setItems] = useState<EduNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchEduNews(EDU_NEWS_DEFAULT_LIMIT));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <h1 className="text-xl font-bold mt-2 mb-4">教育新闻</h1>
      {error ? (
        <div className="py-10 text-center text-sm text-red-600">{error}</div>
      ) : (
        <NewsItemList items={items} loading={loading} />
      )}
    </section>
  );
};
