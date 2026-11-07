"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export type TSubjectOptionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
};

/** subjects 配置页统一使用的选项按钮，视觉与 DifficultySelector 对齐。 */
export const SubjectOptionButton = ({
  active,
  className,
  type = "button",
  ...props
}: TSubjectOptionButtonProps) => (
  <button
    {...props}
    type={type}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-0.5 rounded-lg border px-3.5 text-[13px] font-medium transition",
      "disabled:cursor-not-allowed disabled:opacity-50",
      active
        ? "border-blue-500 bg-blue-50 text-blue-600"
        : "border-transparent bg-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50",
      className,
    )}
  />
);
