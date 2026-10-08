"use client";

import { useState } from "react";

import { cn } from "@/utils/cn";

import { itemOptions, itemText, type TSubjectItem } from "../../result";
import { QuizGame, type TQuizAnswer } from "./QuizGame";
import { EXERCISE_FONT } from "./shared";

/**
 * 成语填空：即时的填字游戏，答题流程与批改页复用 QuizGame，
 * 只有「题干 + 选项」这块是成语自己的样式（对照 sub_html/成语填空.html）。
 */
export const IdiomPaper = ({ items }: { items: TSubjectItem[] }) => (
  <QuizGame
    items={items}
    getLabel={(item) => itemText(item, "stem")}
    getCorrect={(item) => itemText(item, "answer")}
    renderQuestion={(item, { locked, answer }) => (
      <IdiomCard item={item} locked={locked} answer={answer} />
    )}
  />
);

const IdiomCard = ({
  item,
  locked,
  answer,
}: {
  item: TSubjectItem;
  locked: boolean;
  answer: (result: TQuizAnswer) => void;
}) => {
  const [picked, setPicked] = useState(-1);

  const options = itemOptions(item);
  const correct = itemText(item, "answer");
  const stem = itemText(item, "stem");
  const [blankHead, blankTail] = stem.split("__");
  const hasBlank = stem.includes("__");
  // 看释义选成语没有空位；模型偶尔把 type 写错时按题干里有没空位兜底
  const isMean = itemText(item, "type") === "mean" || !hasBlank;

  const pick = (optionIndex: number) => {
    if (locked || picked >= 0) return;
    setPicked(optionIndex);
    const text = options[optionIndex] ?? "";
    answer({ text, correct: text.trim() === correct.trim() });
  };

  return (
    <div className="rounded-2xl bg-white px-[18px] py-[22px] shadow-sm">
      {isMean ? (
        <div className="text-[22px] leading-[1.8] text-[#37455e]">{stem}</div>
      ) : (
        <div
          className={cn(
            "text-center text-[48px] leading-[1.5] font-bold text-[#1c2333]",
            EXERCISE_FONT,
          )}
        >
          {blankHead}
          {hasBlank ? (
            <span className="mx-1.5 inline-block w-[78px] border-b-4 border-[#c3cad8] text-center align-middle">
              {picked >= 0 ? (options[picked] ?? "") : ""}
            </span>
          ) : null}
          {blankTail}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2.5">
        {options.map((option, optionIndex) => {
          const active = picked === optionIndex;
          return (
            <button
              key={option}
              type="button"
              onClick={() => pick(optionIndex)}
              className={cn(
                "w-full rounded-2xl border-[1.5px] text-center transition-colors",
                EXERCISE_FONT,
                isMean
                  ? "px-[18px] py-2.5 text-[24px]"
                  : "px-[26px] py-3 text-[33px]",
                active
                  ? "border-[#2563EB] bg-[#eaf1ff] font-bold text-[#2563EB]"
                  : "border-transparent bg-[#f1f4fa] text-[#5a6478]",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};
