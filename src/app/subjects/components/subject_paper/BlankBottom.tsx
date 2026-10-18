import { cn } from "@/utils/cn";

/** 手写填空位：下划线填满同一行剩余的可用宽度 */
export const BlankBottom = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn("h-[1em] min-w-4 flex-1 border-b border-gray-400", className)}
  />
);
