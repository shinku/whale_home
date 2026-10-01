import type { EduNewsItem } from "@/types/eduNews";
import { NewsItem } from "./NewsItem";

type NewsItemListProps = {
  items: EduNewsItem[];
  loading?: boolean;
  entryFrom?: string;
  emptyText?: string;
};

/** 新闻列表，独立组件，负责加载态与空态 */
export const NewsItemList = ({
  items,
  loading = false,
  entryFrom,
  emptyText = "暂无新闻",
}: NewsItemListProps) => {
  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">加载中…</div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">{emptyText}</div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <NewsItem key={item.id} item={item} entryFrom={entryFrom} />
      ))}
    </div>
  );
};
