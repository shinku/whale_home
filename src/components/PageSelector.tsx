"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import { cn } from "@/utils/cn";

export const PAGE_SELECTOR_ITEM_HEIGHT = 40;

/** 根据滚动距离计算滚轮当前停靠的选项下标。 */
export const pageSelectorIndexAtOffset = (
  scrollTop: number,
  optionCount: number,
) => {
  if (optionCount <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      optionCount - 1,
      Math.round(scrollTop / PAGE_SELECTOR_ITEM_HEIGHT),
    ),
  );
};

export type TPageSelectorProps = {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  /** 选项后的单位，例如“题”“页” */
  unit?: string;
  disabled?: boolean;
  label: string;
};

/** 参考小程序高保真稿实现的纵向滚轮页数/题量选择器。 */
export const PageSelector = ({
  options,
  value,
  onChange,
  unit = "",
  disabled = false,
  label,
}: TPageSelectorProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  /** 滚动或点击产生的值由组件自己处理，避免每次回写时再次强制滚动。 */
  const internalValueRef = useRef<string | null>(null);
  const selectedIndex = Math.max(0, options.indexOf(value));

  const selectIndex = (index: number, smooth: boolean) => {
    if (disabled) return;
    const nextValue = options[index];
    if (!nextValue) return;

    internalValueRef.current = nextValue;
    if (nextValue !== value) onChange(nextValue);
    scrollerRef.current?.scrollTo({
      top: index * PAGE_SELECTOR_ITEM_HEIGHT,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || options.length === 0) return;
    if (internalValueRef.current === value) return;

    internalValueRef.current = value;
    scroller.scrollTo({
      top: selectedIndex * PAGE_SELECTOR_ITEM_HEIGHT,
      behavior: "auto",
    });
  }, [options.length, selectedIndex, value]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || disabled) return;

    const index = pageSelectorIndexAtOffset(
      scroller.scrollTop,
      options.length,
    );
    const nextValue = options[index];
    if (!nextValue || nextValue === value) return;

    internalValueRef.current = nextValue;
    onChange(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const delta = event.key === "ArrowUp" ? -1 : 1;
    const nextIndex = Math.max(
      0,
      Math.min(options.length - 1, selectedIndex + delta),
    );
    selectIndex(nextIndex, true);
  };

  if (options.length === 0) return null;

  return (
    <div
      className={cn(
        "relative h-[132px] overflow-hidden rounded-xl",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <div
        ref={scrollerRef}
        role="listbox"
        aria-label={label}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 overflow-y-auto overscroll-contain py-[46px] outline-none [scroll-snap-type:y_mandatory] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] focus-visible:ring-2 focus-visible:ring-blue-500/30 [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option, index) => {
          const active = index === selectedIndex;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={active}
              disabled={disabled}
              onClick={() => selectIndex(index, true)}
              className={cn(
                "flex h-10 w-full snap-center items-center justify-center text-[14px] font-semibold text-gray-400 transition",
                active
                  ? "text-[17px] font-bold text-blue-600"
                  : "hover:text-gray-500",
              )}
            >
              {option}
              {unit ? ` ${unit}` : ""}
            </button>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-2 top-[46px] bottom-[46px] z-[1] rounded-[10px] border-y border-[#dde3ef] bg-blue-600/[0.04]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[46px] bg-gradient-to-b from-gray-50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[46px] bg-gradient-to-t from-gray-50 to-transparent" />
    </div>
  );
};
