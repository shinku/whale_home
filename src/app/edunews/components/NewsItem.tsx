import Link from "next/link";
import type { EduNewsItem } from "@/types/eduNews";
import {
  ENTRY_FROM_PROJECT,
  ENTRY_FROM_QUERY_KEY,
  formatTime,
} from "@/utils/eduNews";

type NewsItemProps = {
  item: EduNewsItem;
  /** 传给详情页的入口标记，默认来自本项目（列表页） */
  entryFrom?: string;
};

/** 单条新闻（列表行），独立组件，样式后期可在此扩展 */
export const NewsItem = ({
  item,
  entryFrom = ENTRY_FROM_PROJECT,
}: NewsItemProps) => {
  return (
    <Link
      className="block py-3.5 border-b border-gray-200 text-inherit no-underline"
      href={`/edunews/${item.id}?${ENTRY_FROM_QUERY_KEY}=${entryFrom}`}
    >
      <h2 className="text-base font-semibold leading-normal mb-2 text-gray-900">
        {item.title}
      </h2>
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-400">
        {item.source ? (
          <span>{item.source}</span>
        ) : null}
        <span>{formatTime(item.publish_time)}</span>
        {item.category ? (
          <span className="inline-block px-2 py-px rounded-[10px] bg-blue-50 text-blue-600 text-xs">
            {item.category}
          </span>
        ) : null}
      </div>
    </Link>
  );
};
