"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/utils/cn";

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
 * 打印时配置面板隐藏、结果面板展开成整页，保证「保存为 PDF」输出完整卷面。
 */
export const SubjectFragment = forwardRef<
  TSubjectFragmentHandle,
  TSubjectFragmentProps
>(({ config, result, resetLabel = "重新配置" }, ref) => {
  const [showResult, setShowResult] = useState(false);
  const resultScrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      showConfig: () => setShowResult(false),
      showResult: () => {
        setShowResult(true);
        resultScrollRef.current?.scrollTo({ top: 0 });
      },
    }),
    [],
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
              onClick={() => setShowResult(false)}
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
