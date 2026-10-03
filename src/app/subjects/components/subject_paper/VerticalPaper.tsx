import { itemText, type TSubjectItem } from "../../result";
import { itemKey } from "./shared";

/** 竖式：每格一个题，右侧对齐数位 + 一条横线 + 作答区 */
export const VerticalPaper = ({ items }: { items: TSubjectItem[] }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
    {items.map((item, index) => (
      <div
        key={itemKey(item, index, "a")}
        className="break-inside-avoid rounded border border-gray-200 px-3 py-2"
      >
        <div className="text-[11px] text-gray-400">第 {index + 1} 题</div>
        <div className="mt-2 flex flex-col items-end pr-4 font-mono text-[17px] leading-7">
          <span className="tabular-nums">{itemText(item, "a")}</span>
          <span className="tabular-nums">
            <span className="pr-3 text-gray-500">{itemText(item, "op")}</span>
            {itemText(item, "b")}
          </span>
          <span className="mt-1 h-px w-20 bg-gray-400" />
          <span className="h-7 w-20" />
        </div>
      </div>
    ))}
  </div>
);
