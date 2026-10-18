import Link from "next/link";

import { parseSubjectResult } from "../result";
import { getSubjectByRequestId } from "../service";
import { getSubject, type TSubjectSlug } from "../subjects";
import { SubjectResult } from "./SubjectResult";

/** 详情页的 search params（Next 里是 Promise） */
type TSearchParams = Record<string, string | string[] | undefined>;

/** query 参数可能是数组，取第一个值 */
const firstValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** 回到配置页的链接：保留 requestid 之外的 query（小程序 userId / openid） */
const configHref = (slug: string, params: TSearchParams) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "requestid") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else if (value != null) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return `/subjects/${slug}${query ? `?${query}` : ""}`;
};

/** 取不到结果时的兜底页：给出原因并回到配置页 */
const DetailMessage = ({
  href,
  message,
}: {
  href: string;
  message: string;
}) => (
  <div className="mx-auto w-full max-w-[794px] px-4 pt-24 text-center">
    <p className="text-sm text-gray-500">{message}</p>
    <Link
      href={href}
      className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
    >
      重新配置
    </Link>
  </div>
);

/**
 * 子学科详情页：按 URL 上的 requestid 取这次生成的结果。
 *
 * 取数放在服务端（SSR），拿到结果直接以 props 传给客户端的结果组件渲染，
 * 前端不再在 useEffect 里请求 —— 刷新 / 分享链接都能复现同一份结果。
 * 复用 `../service`（与 `/api/subjects/[subject]` 同一套出题服务）。
 */
export const SubjectDetailPage = async ({
  slug,
  searchParams,
}: {
  slug: TSubjectSlug;
  searchParams: Promise<TSearchParams>;
}) => {
  const params = await searchParams;
  const backHref = configHref(slug, params);

  const subject = getSubject(slug);
  if (!subject) {
    return <DetailMessage href={backHref} message="该学科暂未配置" />;
  }

  const requestid = firstValue(params.requestid).trim();
  const userId = firstValue(params.userId) || firstValue(params.openid);

  if (!requestid) {
    return (
      <DetailMessage href={backHref} message="缺少 requestid，无法读取结果" />
    );
  }

  const response = await getSubjectByRequestId({ requestid, userId });
  if (!response.ok) {
    return <DetailMessage href={backHref} message={response.error} />;
  }

  const result = parseSubjectResult(response.data);

  return (
    <SubjectResult
      subject={subject}
      result={result}
      rawText={
        result
          ? ""
          : typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data, null, 2)
      }
      userId={userId}
    />
  );
};
