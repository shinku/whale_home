"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

export type TGradientButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  text: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  loadingText?: ReactNode;
};

/** 品牌渐变主按钮，subjects 生成和其他主操作共用。 */
export const GradientButton = ({
  text,
  icon,
  loading = false,
  loadingText = "处理中...",
  disabled,
  className,
  type = "button",
  ...props
}: TGradientButtonProps) => (
  <button
    {...props}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading}
    className={cn(
      "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 px-4 text-base font-semibold text-white transition",
      "hover:brightness-105 active:opacity-85",
      "disabled:cursor-not-allowed disabled:bg-gray-300 disabled:bg-none disabled:opacity-100",
      className,
    )}
  >
    {loading ? (
      loadingText
    ) : (
      <>
        {icon}
        {text}
      </>
    )}
  </button>
);
