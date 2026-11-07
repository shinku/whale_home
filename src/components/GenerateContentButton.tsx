"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export type TGenerateContentButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
  };

/** subjects 页面统一的品牌渐变生成按钮。 */
export const GenerateContentButton = ({
  loading = false,
  disabled,
  className,
  children = "生成内容",
  ...props
}: TGenerateContentButtonProps) => (
  <button
    {...props}
    type="button"
    disabled={disabled || loading}
    aria-busy={loading}
    className={cn(
      "h-12 w-full rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 px-4 text-base font-semibold text-white transition",
      "hover:brightness-105 active:opacity-85",
      "disabled:cursor-not-allowed disabled:bg-gray-300 disabled:bg-none disabled:opacity-100",
      className,
    )}
  >
    {loading ? "生成中..." : children}
  </button>
);
