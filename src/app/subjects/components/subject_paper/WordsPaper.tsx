"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

import { itemOptions, itemText, type TSubjectItem } from "../../result";
import { IpaText } from "./IpaText";
import { QuizGame, type TQuizAnswer } from "./QuizGame";
import { EXERCISE_FONT } from "./shared";

/** 拼写题补全后自动判卷的延迟，对应原型 pressWordKey 的 260ms */
const SPELL_SUBMIT_DELAY_MS = 260;

/** 原型键盘：三行 QWERTY，最后一行右侧是退格 */
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

/**
 * 背单词：答题流程与批改页与成语填空完全一致（复用 QuizGame），
 * 只有题卡不同 —— 选择题照 sub_html/背单词.html 的 .word-prompt + 纵向选项，
 * 拼写题用原型的下划线作答区 + 屏幕键盘 + 输满自动判卷。
 */
export const WordsPaper = ({
  items,
  type,
}: {
  items: TSubjectItem[];
  type?: string;
}) => (
  <QuizGame
    items={items}
    getLabel={(item) => itemText(item, "prompt")}
    getCorrect={(item) => itemText(item, "answer") || itemText(item, "en")}
    renderQuestion={(item, { locked, answer }) => (
      <WordCard item={item} type={type} locked={locked} answer={answer} />
    )}
  />
);

const WordCard = ({
  item,
  type,
  locked,
  answer,
}: {
  item: TSubjectItem;
  type?: string;
  locked: boolean;
  answer: (result: TQuizAnswer) => void;
}) => {
  const options = itemOptions(item);
  const isSpell = type === "spell" || options.length === 0;
  const [picked, setPicked] = useState(-1);

  return (
    <div className="rounded-2xl bg-white px-[18px] py-[22px] shadow-sm">
      <div
        className={cn(
          "text-center text-[40px] leading-[1.4] font-extrabold break-words text-[#1c2333]",
          EXERCISE_FONT,
        )}
      >
        {itemText(item, "prompt")}
      </div>

      {/* 音标：三种题型都给，拼写/中译英相当于「听读音写单词」的提示 */}
      <IpaText
        ipa={itemText(item, "ipa")}
        speakText={itemText(item, "en")}
        className="mt-1.5 flex text-[18px]"
      />

      {isSpell ? (
        <SpellInput item={item} locked={locked} answer={answer} />
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {options.map((option, optionIndex) => (
            <ChoiceOption
              key={option}
              label={option}
              active={picked === optionIndex}
              onPick={() => {
                if (locked || picked >= 0) return;
                setPicked(optionIndex);
                answer({
                  text: option,
                  correct: option.trim() === itemText(item, "answer").trim(),
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** 选择题选项：点击即判卷并进入下一题 */
const ChoiceOption = ({
  label,
  active,
  onPick,
}: {
  label: string;
  active: boolean;
  onPick: () => void;
}) => (
  <button
    type="button"
    onClick={onPick}
    className={cn(
      "w-full rounded-[14px] border-[1.5px] px-[18px] py-3 text-center text-[22px] transition-colors",
      active
        ? "border-[#2563EB] bg-[#eaf1ff] font-bold text-[#2563EB]"
        : "border-transparent bg-[#f1f4fa] text-[#5a6478]",
    )}
  >
    {label}
  </button>
);

/**
 * 拼写题：下划线作答区 + 屏幕键盘，拼满单词长度自动判卷。
 *
 * 作答区是一个真实的 input：点击后可用系统/软键盘输入，桌面端也可以直接敲字母
 * （不点作答区时由下面的全局 keydown 兜底）。无论哪种方式，输入都会被收口到
 * `apply`：只保留字母、转小写、按单词长度截断，其余字符一律丢弃。
 */
const SpellInput = ({
  item,
  locked,
  answer,
}: {
  item: TSubjectItem;
  locked: boolean;
  answer: (result: TQuizAnswer) => void;
}) => {
  const word = itemText(item, "en");
  const expected = itemText(item, "answer") || word;
  const maxLength = word.length;

  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // 快速连按时用 ref 读取最新值，避免 state 更新滞后导致丢字
  const typedRef = useRef("");
  const pendingRef = useRef(false);

  const submit = (value: string) =>
    answer({
      text: value,
      correct: value.trim().toLowerCase() === expected.trim().toLowerCase(),
    });

  /** 只保留英文字母、转小写、按单词长度截断 */
  const sanitize = (raw: string) =>
    raw
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase()
      .slice(0, maxLength || undefined);

  /** 唯一的写入入口：过滤非字母、转小写、限长，拼满自动判卷 */
  const apply = (raw: string) => {
    if (locked || pendingRef.current) return;
    const next = sanitize(raw);
    typedRef.current = next;
    setTyped(next);
    // 拼到完整长度就自动判卷，与原型一致
    if (maxLength > 0 && next.length >= maxLength) {
      pendingRef.current = true;
      setPending(true);
      window.setTimeout(() => submit(next), SPELL_SUBMIT_DELAY_MS);
    }
  };

  const pushChar = (char: string) => apply(typedRef.current + char);
  const backspace = () => apply(typedRef.current.slice(0, -1));

  // 系统键盘兜底：作答区没有聚焦时也能直接用物理键盘输入字母 / 退格。
  // 不写依赖数组，保证监听器每次渲染都用最新的 locked / typed。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (locked || event.metaKey || event.ctrlKey || event.altKey) return;

      // 已经聚焦在某个输入框（本组件或页面其它输入）时交给原生行为，避免重复写入
      const active = document.activeElement as HTMLElement | null;
      if (
        active === inputRef.current ||
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA" ||
        active?.isContentEditable
      ) {
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        pushChar(event.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const keyboardLocked = locked || pending;
  // 数据异常（没有 en）时也至少给一个格子，保证作答区始终可见
  const slotCount = Math.max(maxLength, 1);
  // 单词较长时格子会变窄，同步缩小字号，避免字母挤在一起
  const slotTextClass =
    slotCount > 9
      ? "text-[16px]"
      : slotCount > 6
        ? "text-[22px]"
        : "text-[28px]";

  return (
    <>
      <div className="relative mt-[18px]">
        {/* 字母格：个数 = 单词长度，primary 色圆角边框提示要输入几个字母 */}
        <div className="flex justify-center gap-[6px]">
          {Array.from({ length: slotCount }, (_, slotIndex) => {
            const char = typed[slotIndex] ?? "";
            const active = slotIndex === typed.length && !keyboardLocked;
            return (
              <span
                key={slotIndex}
                className={cn(
                  "flex h-[58px] max-w-[58px] min-w-0 flex-1 items-center justify-center rounded-lg border-2 border-indigo-500 font-bold text-[#1c2333] transition-colors",
                  slotTextClass,
                  char ? "bg-indigo-50" : "bg-white",
                  EXERCISE_FONT,
                )}
              >
                {char ||
                  (active ? (
                    <span className="animate-pulse text-indigo-500">|</span>
                  ) : null)}
              </span>
            );
          })}
        </div>

        {/* 真实输入框透明覆盖在字母格上：点击即聚焦，可用系统/软键盘输入 */}
        <input
          ref={inputRef}
          value={typed}
          onChange={(event) => {
            // 过滤后若与原值相同（例如只多敲了一个空格），React 不会重渲染，
            // 这里手动把 DOM 拉回干净值，避免非法字符残留在输入框里。
            const next = sanitize(event.target.value);
            if (event.target.value !== next) event.target.value = next;
            apply(next);
          }}
          readOnly={keyboardLocked}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="text"
          aria-label="拼写答案，只能输入英文字母"
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-[30px] text-transparent caret-transparent opacity-0 outline-none"
        />
      </div>
      <p className="mt-1 text-center text-[12px] text-gray-400">
        直接用键盘输入字母，或用下方键盘作答
      </p>

      <div className="mt-4 rounded-xl border-t border-[#d5dbe8] bg-[#e9edf5] px-1.5 py-2">
        {KEYBOARD_ROWS.map((row) => (
          <div
            key={row}
            className="mb-2 flex justify-center gap-[5px] last:mb-0"
          >
            {row.split("").map((char) => (
              <button
                key={char}
                type="button"
                // 阻止按下时把焦点从作答区抢走，避免动到系统的软键盘
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pushChar(char)}
                disabled={keyboardLocked}
                className="flex h-[42px] max-w-[32px] flex-1 items-center justify-center rounded-md bg-white text-[15px] font-bold text-[#1c2333] shadow-[0_1px_0_rgba(20,40,90,0.28)] select-none active:bg-[#dbeafe] disabled:opacity-60"
              >
                {char.toUpperCase()}
              </button>
            ))}
            {row === "zxcvbnm" ? (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={backspace}
                disabled={keyboardLocked}
                className="flex h-[42px] max-w-[56px] flex-1 items-center justify-center rounded-md bg-white text-[15px] font-bold text-[#1c2333] shadow-[0_1px_0_rgba(20,40,90,0.28)] select-none active:bg-[#dbeafe] disabled:opacity-60"
              >
                ⌫
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
};
