"use client";

import { useEffect } from "react";

export const shouldBlockDocumentOverscroll = ({
  scrollTop,
  scrollHeight,
  viewportHeight,
  deltaY,
}: {
  scrollTop: number;
  scrollHeight: number;
  viewportHeight: number;
  deltaY: number;
}) => {
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop + viewportHeight >= scrollHeight - 1;
  return (atTop && deltaY > 0) || (atBottom && deltaY < 0);
};

const isScrollableVertically = (element: Element) => {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  return (
    (overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay") &&
    element.scrollHeight > element.clientHeight
  );
};

const canInnerScrollerConsume = (
  target: EventTarget | null,
  deltaY: number,
) => {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body) {
    if (isScrollableVertically(node)) {
      const atTop = node.scrollTop <= 0;
      const atBottom =
        node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      if ((deltaY > 0 && !atTop) || (deltaY < 0 && !atBottom)) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
};

/** 阻止 iOS WebView 在页面顶部/底部继续拖拽产生橡皮筋回弹。 */
export const IOSOverscrollGuard = () => {
  useEffect(() => {
    const isIPadDesktopMode =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (!/iPhone|iPad|iPod/i.test(navigator.userAgent) && !isIPadDesktopMode) {
      return;
    }

    let startY = 0;
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        startY = event.touches[0].clientY;
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;

      const deltaY = event.touches[0].clientY - startY;
      const scrollingElement =
        document.scrollingElement ?? document.documentElement;
      if (
        canInnerScrollerConsume(event.target, deltaY) ||
        !shouldBlockDocumentOverscroll({
          scrollTop: scrollingElement.scrollTop,
          scrollHeight: scrollingElement.scrollHeight,
          viewportHeight: window.innerHeight,
          deltaY,
        })
      ) {
        return;
      }

      if (event.cancelable) event.preventDefault();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
};
