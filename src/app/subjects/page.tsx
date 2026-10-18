import Link from "next/link";

import { SUBJECTS } from "./subjects";

/** 当前页面的 search params（Next 里是 Promise） */
type TSearchParams = Record<string, string | string[] | undefined>;

/**
 * 把当前页面的 query 原样拼成 href 后缀。
 *
 * 小程序打开时会带 userId / openid（子页要用它当 x-user-id 调接口），
 * 从首页点进子页必须把这些参数带上，否则点进去就丢了。
 */
export const toQuerySuffix = (searchParams: TSearchParams) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else if (value != null) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
};

/** subjects 首页：罗列全部子学科，点进去按选项生成内容 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<TSearchParams>;
}) {
  // 子页要把 query 带过去（例如小程序的 userId / openid）
  const suffix = toQuerySuffix(await searchParams);

  return (
    <main className="mx-auto w-full max-w-[794px] px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">AI 学科工具</h1>
      <p className="mt-2 text-sm text-gray-500">
        选择科目与选项，AI 按对应提示词生成可展示、可打印的练习内容。
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SUBJECTS.map((subject) => (
          <Link
            key={subject.slug}
            href={`/subjects/${subject.slug}${suffix}`}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-500"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base font-bold text-blue-600">
              {subject.emoji}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-gray-900">
                {subject.title}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                {subject.desc}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        每个科目的系统提示词在 src/prompts/&lt;科目&gt;.md
      </p>
    </main>
  );
}
