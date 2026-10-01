"use client";

import { useRouter } from "next/navigation";
import { ENTRY_FROM_PROJECT } from "@/utils/eduNews";
import { isMiniProgram, miniProgramNavigateBack } from "@/utils/wx";

/**
 * 详情页返回按钮，两种入口：
 * - entryFrom=project（从本项目列表页点击进入）：直接返回上一页
 * - 其他（直接访问 / 来自小程序）：调用微信 JSSDK 返回小程序
 */
export const BackButton = ({ entryFrom }: { entryFrom?: string }) => {
  const router = useRouter();

  const handleBack = () => {
    if (entryFrom === ENTRY_FROM_PROJECT) {
      router.back();
      return;
    }

    if (isMiniProgram()) {
      miniProgramNavigateBack(1);
      return;
    }

    // 兜底：没有可返回的历史记录时回到列表页
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/edunews");
  };

  return (
    <button
      type="button"
      className="inline-flex items-center px-3.5 py-1.5 mb-4 border border-gray-300 rounded-2xl bg-white text-gray-700 text-[13px] cursor-pointer"
      onClick={handleBack}
    >
      ← 返回
    </button>
  );
};
