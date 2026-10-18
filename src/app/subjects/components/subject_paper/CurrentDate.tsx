"use client";

import { useEffect, useState } from "react";

const twoDigits = (value: number) => String(value).padStart(2, "0");

export const formatCurrentDate = (date: Date) =>
  `${date.getFullYear()}年${twoDigits(date.getMonth() + 1)}月${twoDigits(date.getDate())}日`;

/** 卷头展示的日期：页面打开时定格，不再自动刷新 */
export const CurrentDate = () => {
  const [date, setDate] = useState(() => formatCurrentDate(new Date()));

  useEffect(() => {
    setDate(formatCurrentDate(new Date()));
  }, []);

  return (
    <span suppressHydrationWarning className="shrink-0 tabular-nums">
      {date}
    </span>
  );
};
