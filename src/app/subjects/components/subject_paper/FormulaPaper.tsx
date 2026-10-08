import { cn } from "@/utils/cn";

import { itemText, type TSubjectItem } from "../../result";
import { EXERCISE_FONT, itemKey } from "./shared";

/** 数学公式：默写卷只给名称留白，背诵卷给名称 + 公式 + 说明 */
export const FormulaPaper = ({
  items,
  mode,
}: {
  items: TSubjectItem[];
  mode?: string;
}) =>
  mode === "recite" ? (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          key={itemKey(item, index, "name")}
          className="break-inside-avoid border-b border-dashed border-gray-200 pb-2 last:border-b-0"
        >
          <div className="text-[14px] font-semibold">
            {index + 1}. {itemText(item, "name")}
          </div>
          <div className={cn("mt-0.5 text-[16px]", EXERCISE_FONT)}>
            {itemText(item, "expr")}
          </div>
          {itemText(item, "note") ? (
            <div className="mt-0.5 text-[12px] text-gray-500">
              {itemText(item, "note")}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  ) : (
    <div className="columns-2 gap-6 [&>*]:break-inside-avoid">
      {items.map((item, index) => (
        <div
          key={itemKey(item, index, "name")}
          className="mb-4 flex items-baseline gap-2"
        >
          <span className="w-6 shrink-0 text-right text-[12px] text-gray-400">
            {index + 1}.
          </span>
          <span className="shrink-0 text-[14px]">{itemText(item, "name")}</span>
          <span className="mt-1 h-[18px] flex-1 border-b border-dotted border-gray-400" />
        </div>
      ))}
    </div>
  );
