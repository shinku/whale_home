import { itemText, type TSubjectItem } from "../../result";
import { itemKey } from "./shared";

/** 拍照翻译：一行原文 + 一行译文 */
export const TranslatePaper = ({ items }: { items: TSubjectItem[] }) => (
  <div className="flex flex-col gap-3">
    {items.map((item, index) => (
      <div
        key={itemKey(item, index, "source")}
        className="break-inside-avoid border-l-2 border-gray-200 pl-3"
      >
        <div className="text-[13px] text-gray-500">
          {itemText(item, "source")}
        </div>
        <div className="text-[16px] font-medium">
          {itemText(item, "target")}
        </div>
      </div>
    ))}
  </div>
);
