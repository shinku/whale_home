import { itemOptions, itemText, type TSubjectItem } from "../../result";
import { itemKey } from "./shared";

/** 背单词：选择题给四个候选，拼写题留拼写格 */
export const WordsPaper = ({
  items,
  type,
}: {
  items: TSubjectItem[];
  type?: string;
}) => (
  <div className="flex flex-col gap-4">
    {items.map((item, index) => {
      const options = itemOptions(item);
      return (
        <div
          key={itemKey(item, index, "prompt")}
          className="break-inside-avoid border-b border-dashed border-gray-200 pb-3 last:border-b-0"
        >
          <div className="text-[15px]">
            {index + 1}. {itemText(item, "prompt")}
          </div>
          {type === "spell" || options.length === 0 ? (
            <div className="mt-2 flex gap-1.5">
              {Array.from({
                length: Math.max(4, itemText(item, "en").length || 4),
              }).map((_, box) => (
                <span
                  key={box}
                  className="h-8 w-7 border-b border-gray-400"
                  aria-hidden
                />
              ))}
            </div>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {options.map((option) => (
                <span
                  key={option}
                  className="rounded-full border border-gray-200 px-3 py-0.5 text-[13px] text-gray-700"
                >
                  {option}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);
