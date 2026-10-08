"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/utils/cn";

/** 详情页标记：URL 上带 ?detail=1 表示当前停在结果页 */
const DETAIL_QUERY_KEY = "detail";
const DETAIL_QUERY_VALUE = "1";
/** 我们自己 push 进 history 的状态标记，用来判断「重新配置」能否直接 back */
const DETAIL_STATE_KEY = "subjectDetail";

/** 当前 URL 是否带 detail 标记 */
const hasDetailQuery = () =>
  new URLSearchParams(window.location.search).get(DETAIL_QUERY_KEY) ===
  DETAIL_QUERY_VALUE;

/** 生成带 / 不带 detail 的 URL，保留 userId 等已有 query，供 pushState / replaceState 使用 */
const buildDetailUrl = (withDetail: boolean) => {
  const url = new URL(window.location.href);
  if (withDetail) {
    url.searchParams.set(DETAIL_QUERY_KEY, DETAIL_QUERY_VALUE);
  } else {
    url.searchParams.delete(DETAIL_QUERY_KEY);
  }
  return `${url.pathname}${url.search}${url.hash}`;
};

/** 当前这条 history 记录是不是「进入详情」时我们 push 的那条 */
const isOurDetailEntry = () =>
  (window.history.state as Record<string, unknown> | null)?.[
    DETAIL_STATE_KEY
  ] === true;

export type TSubjectFragmentHandle = {
  /** 配置页滑入视窗 */
  showConfig: () => void;
  /** 结果页滑入视窗 */
  showResult: () => void;
};

type TFragmentProps = {
  children: ReactNode;
};

/**
 * 配置面板：占满视窗高度，内部纵向滚动。
 * 页面本身不滚动（见 SubjectFragment），滚动都发生在面板内部。
 */
export const ConfigFragment = ({ children }: TFragmentProps) => (
  <section className="h-full w-1/2 shrink-0 overflow-y-auto overscroll-contain print:hidden">
    {children}
  </section>
);

/**
 * 结果面板：同样占满视窗高度、内部纵向滚动，
 * 右下角留一个固定的操作位（放「重新配置」这类统一按钮）。
 */
export const ResultFragment = ({
  children,
  action,
  scrollRef,
}: TFragmentProps & {
  action?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) => (
  <section className="relative h-full w-1/2 shrink-0 print:h-auto print:w-full">
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overscroll-contain pb-24 print:h-auto print:overflow-visible print:pb-0"
    >
      {children}
    </div>
    {action ? (
      <div className="absolute right-5 bottom-6 z-20 print:hidden">
        {action}
      </div>
    ) : null}
  </section>
);

type TSubjectFragmentProps = {
  config: ReactNode;
  result: ReactNode;
  /** 结果页右下角按钮文案 */
  resetLabel?: string;
};

/**
 * 子学科页面的固定布局：配置页与结果页各占一屏，横向滑动切换。
 *
 * 用法：SubjectFragment 接收 config / result 两个节点与一个 ref；
 * 生成完成后调用 ref.current.showResult() 让结果页滑入，
 * 结果页右下角的「重新配置」按钮会调用 showConfig() 让配置页滑回。
 *
 * 切换时只改 URL、不刷新页面：进入结果页 push `?detail=1`，
 * 「重新配置」等价于浏览器返回（history.back），浏览器的前进 / 后退也能切换两个面板。
 *
 * 打印时配置面板隐藏、结果面板展开成整页，保证「保存为 PDF」输出完整卷面。
 */
export const SubjectFragment = forwardRef<
  TSubjectFragmentHandle,
  TSubjectFragmentProps
>(({ config, result, resetLabel = "重新配置" }, ref) => {
  const [showResult, setShowResult] = useState(false);
  const resultScrollRef = useRef<HTMLDivElement>(null);

  /** 配置页 → 详情页：滑入结果页，并把 ?detail=1 写进 URL（只改 URL，不刷新页面） */
  const openDetail = useCallback(() => {
    setShowResult(true);
    resultScrollRef.current?.scrollTo({ top: 0 });

    // 已经在详情 URL 上（例如刷新后再次生成）就不重复 push，避免要按两次返回
    if (hasDetailQuery()) return;
    window.history.pushState(
      { ...(window.history.state ?? {}), [DETAIL_STATE_KEY]: true },
      "",
      buildDetailUrl(true),
    );
  }, []);

  /**
   * 详情页 → 配置页：等价于浏览器返回。
   * 进入详情时我们 push 过一条带标记的记录，这里直接 back，让 URL 和界面一起退回；
   * 若是直接打开或刷新 detail 链接（history 里没有标记），只把 URL 归位、不后退。
   */
  const closeDetail = useCallback(() => {
    if (isOurDetailEntry()) {
      window.history.back();
      return;
    }
    if (hasDetailQuery()) {
      window.history.replaceState(
        window.history.state,
        "",
        buildDetailUrl(false),
      );
    }
    setShowResult(false);
  }, []);

  // 浏览器前进 / 后退：按 URL 上的 detail 决定停在配置页还是结果页
  useEffect(() => {
    const onPopState = () => {
      if (hasDetailQuery()) {
        setShowResult(true);
        resultScrollRef.current?.scrollTo({ top: 0 });
      } else {
        setShowResult(false);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // 首屏若带着 detail（刷新或直接打开）：结果内容已随刷新丢失，把 URL 归位到配置页
  useEffect(() => {
    if (hasDetailQuery() && !isOurDetailEntry()) {
      window.history.replaceState(
        window.history.state,
        "",
        buildDetailUrl(false),
      );
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      showConfig: closeDetail,
      showResult: openDetail,
    }),
    [closeDetail, openDetail],
  );

  // 整个页面不滚动，滚动只发生在两个面板内部
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    document.documentElement.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, []);

  return (
    <div className="h-[100dvh] w-full overflow-hidden print:h-auto print:overflow-visible">
      <div
        className={cn(
          "flex h-full w-[200%] transition-transform duration-300 ease-out print:block print:h-auto print:w-full print:translate-x-0",
          showResult ? "-translate-x-1/2" : "translate-x-0",
        )}
      >
        <ConfigFragment>{config}</ConfigFragment>
        <ResultFragment
          scrollRef={resultScrollRef}
          action={
            <button
              type="button"
              onClick={closeDetail}
              className="h-11 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 active:scale-95"
            >
              {resetLabel}
            </button>
          }
        >
          {result}
        </ResultFragment>
      </div>
    </div>
  );
});

SubjectFragment.displayName = "SubjectFragment";
