"use client";

import { StarFilled } from "@ant-design/icons";

import { SubjectOptionButton } from "@/components/SubjectOptionButton";

export const MAX_DIFFICULTY_LEVEL = 3;

/** 难度下标从 0 开始，界面固定显示 1~3 颗星。 */
export const difficultyStarCount = (index: number) =>
  Math.max(1, Math.min(MAX_DIFFICULTY_LEVEL, index + 1));

export type TDifficultySelectorProps = {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
};

/** 使用 1~3 颗星表示简单、中等、困难三档难度。 */
export const DifficultySelector = ({
  options,
  value,
  onChange,
  disabled = false,
  label,
}: TDifficultySelectorProps) => (
  <div
    role="radiogroup"
    aria-label={label}
    className="flex gap-2"
  >
    {options.slice(0, MAX_DIFFICULTY_LEVEL).map((option, index) => {
      const active = option === value;
      const starCount = difficultyStarCount(index);

      return (
        <SubjectOptionButton
          key={option}
          active={active}
          role="radio"
          aria-checked={active}
          aria-label={`${starCount} 星难度：${option}`}
          title={option}
          disabled={disabled}
          onClick={() => onChange(option)}
          className="flex-1"
        >
          {Array.from({ length: starCount }, (_, starIndex) => (
            <StarFilled
              key={starIndex}
              aria-hidden="true"
              className="text-[15px] text-yellow-500!"
            />
          ))}
        </SubjectOptionButton>
      );
    })}
  </div>
);
