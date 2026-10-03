import { itemText, type TSubjectItem } from "../../result";
import { cn } from "@/utils/cn";
import { chunk } from "./shared";

/** 每页 20 字（5 列 × 4 行），与 sub_html/字帖本.html 的 .cp-grid 一致 */
const CHARS_PER_PAGE = 20;

/**
 * 田字格：金色描边 + 虚线十字（对应原型里的 .tz-box / ::before / ::after）。
 * - 描红格：放浅灰色的范字（.zi.trace）
 * - 临写格：只留空框（.tz-box.blank）
 */
const TianZiGe = ({
  char,
  blank = false,
}: {
  char?: string;
  blank?: boolean;
}) => (
  <span className="relative flex h-[46px] w-[46px] items-center justify-center rounded-[4px] border-[1.5px] border-[#d9a441] bg-[#fffef8] before:absolute before:top-[3px] before:bottom-[3px] before:left-1/2 before:border-l before:border-dashed before:border-[#ead9a0] after:absolute after:top-1/2 after:right-[3px] after:left-[3px] after:border-t after:border-dashed after:border-[#ead9a0]">
    <span
      className={cn(
        "font-[Kaiti_SC,STKaiti,KaiTi,cursive] text-[26px] leading-none font-semibold",
        blank ? "text-transparent" : "text-[#c8cdd6]",
      )}
    >
      {blank ? "" : (char ?? "")}
    </span>
  </span>
);

/**
 * 字帖：一页一张字帖纸（拼音 + 描红格 + 临写空格），
 * 版式对照 sub_html/字帖本.html 的 .cp-sheet / .cp-title / .cp-tip / .cp-grid。
 */
export const CopybookPaper = ({
  items,
  title = "字帖本",
}: {
  items: TSubjectItem[];
  title?: string;
}) => {
  const pages = chunk(items, CHARS_PER_PAGE);

  return (
    <div className="flex flex-col gap-5">
      {pages.map((page, pageIndex) => (
        <section
          key={pageIndex}
          className="relative break-inside-avoid rounded-[6px] border border-[#f0e4c8] bg-white px-[18px] py-4 shadow-sm print:border-0 print:shadow-none"
        >
          {pages.length > 1 ? (
            <span className="absolute top-2.5 left-4 text-[11px] text-[#8a8f9c]">
              {pageIndex + 1} / {pages.length}
            </span>
          ) : null}

          <div className="text-center text-[20px] font-extrabold tracking-[3px] text-[#1c2333]">
            {title}
          </div>

          <div className="mt-2 mb-2.5 rounded-[4px] border border-dashed border-[#ead9a0] bg-[#fff8ec] px-2 py-[3px] text-center text-[10px] text-[#b08a3e]">
            先观察笔顺 → 描红一遍 → 下方空格临写一遍
          </div>

          <div className="grid grid-cols-5 gap-x-1.5 gap-y-2.5">
            {page.map((item, index) => (
              <div
                key={`${pageIndex}-${index}-${itemText(item, "char")}`}
                className="flex flex-col items-center gap-0.5"
              >
                <span className="h-3 text-[9px] tracking-[1px] text-[#8a5a2b]">
                  {itemText(item, "pinyin")}
                </span>
                {/* 与原型一致：上方描红格，下方空格临写 */}
                <TianZiGe char={itemText(item, "char")} />
                <TianZiGe blank />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
