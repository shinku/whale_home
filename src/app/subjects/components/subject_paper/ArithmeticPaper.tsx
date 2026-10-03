import { itemText, type TSubjectItem } from "../../result";
import { itemKey } from "./shared";

/** 口算：两列排布，题后留横线作答 */
export const ArithmeticPaper = ({ items }: { items: TSubjectItem[] }) => (
  <div className="columns-2 gap-6 [&>*]:break-inside-avoid">
    {items.map((item, index) => (
      <div
        key={itemKey(item, index, "question")}
        className="mb-3 flex items-baseline gap-2 text-[15px]"
      >
        <span className="w-6 shrink-0 text-right text-[12px] text-gray-400">
          {index + 1}.
        </span>
        <span className="shrink-0 tabular-nums">
          {itemText(item, "question")}
        </span>
        <span className="mt-1 h-[18px] min-w-[56px] flex-1 border-b border-dotted border-gray-400" />
      </div>
    ))}
  </div>
);
