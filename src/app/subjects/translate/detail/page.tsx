import Link from "next/link";

import { TranslateCanvas } from "../../components/TranslateCanvas";
import { getTranslateResultById } from "../service";

type TSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

const configHref = (params: TSearchParams) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "id" || key === "requestid") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else if (value != null) {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return `/subjects/translate${query ? `?${query}` : ""}`;
};

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
      重新上传
    </Link>
  </div>
);

/**
 * 拍照翻译结果页。
 *
 * 浏览器地址使用 ?id=xxx；小程序既有结果页继续透传 requestid，
 * 因此这里两种参数都兼容。
 */
export default async function TranslateDetailPage({
  searchParams,
}: {
  searchParams: Promise<TSearchParams>;
}) {
  const params = await searchParams;
  const backHref = configHref(params);
  const id = firstValue(params.id) || firstValue(params.requestid);
  const userId =
    firstValue(params.userId) ||
    firstValue(params.openid) ||
    firstValue(params.openId);

  if (!id) {
    return (
      <DetailMessage href={backHref} message="缺少翻译结果 id，无法读取结果" />
    );
  }

  const response = await getTranslateResultById({ id, userId });
  if (!response.ok) {
    return <DetailMessage href={backHref} message={response.error} />;
  }

  return (
    <main className="mx-auto w-full max-w-[794px] px-4 pt-6 pb-16">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">翻译结果</h1>
        </div>
        <Link
          href={backHref}
          className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600"
        >
          重新上传
        </Link>
      </header>

        <TranslateCanvas
            image={response.data.source}
            blocks={response.data.result}
            imageWidth={response.data.imageWidth}
            imageHeight={response.data.imageHeight}
          />

      <div className="text-sm mt-[16px] flex justify-center">文字内容</div>
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        {response.data.result.length > 0 && (
        <ol className="mt-4 space-y-2" aria-label="翻译文字内容">
          {response.data.result.map((block, index) => (
            <li
              key={`${block.rect.x}-${block.rect.y}-${index}`}
              className=""
            >
              <p className="leading-4 text-[12px] whitespace-pre-wrap text-gray-700 select-text">
                {block.message}
              </p>
            </li>
          ))}
        </ol>
      ) }
      </div>

        {response.data.result.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            未识别到可以翻译的文字，请更换图片后重试。
          </p>
        ) : null}

    </main>
  );
}
