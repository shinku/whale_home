import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 className。
 *
 * - clsx 负责条件拼接（过滤 false / null / undefined）
 * - tailwind-merge 负责按 Tailwind 语义去重：同类样式冲突时只保留后面那个，
 *   例如 cn("py-3", "py-2.5") 只留 py-2.5，不用再靠拼接顺序规避冲突
 *
 * 用法：<div className={cn("rounded-xl p-4", active && "border-blue-600")} />
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
