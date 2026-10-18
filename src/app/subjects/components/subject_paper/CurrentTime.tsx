"use client";

import { useEffect, useState } from "react";

const twoDigits = (value: number) => String(value).padStart(2, "0");

export const formatCurrentTime = (date: Date) =>
  `${twoDigits(date.getHours())}时${twoDigits(date.getMinutes())}分${twoDigits(date.getSeconds())}秒`;

/** 卷头展示的时间：页面打开时定格，不再自动刷新 */
export const CurrentTime = () => {
  const [time, setTime] = useState(() => formatCurrentTime(new Date()));

  useEffect(() => {
    setTime(formatCurrentTime(new Date()));
  }, []);

  return (
    <span suppressHydrationWarning className="shrink-0 tabular-nums">
      {time}
    </span>
  );
};
