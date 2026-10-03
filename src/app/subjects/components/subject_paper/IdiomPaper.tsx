"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { itemOptions, itemText, type TSubjectItem } from "../../result";
import { cn } from "@/utils/cn";

/** 选中后停留一会儿再跳下一题，跟原型 pickIdiom 的 420ms 一致 */
const NEXT_DELAY_MS = 420;
/** 进入练习前的倒计时秒数，对应原型 runIdiomCountdown 的 3-2-1 */
const COUNTDOWN_FROM = 3;

const KAI_FONT = "font-[Kaiti_SC,STKaiti,KaiTi,cursive]";

/** 秒 -> mm:ss */
const formatTime = (seconds: number) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
};

/**
 * 成语填空：即时的填字游戏（对照 sub_html/成语填空.html 的在线练习与批改页）。
 * 一题一题作答，选中选项后自动跳到下一个成语，全部答完展示每题对错。
 */
export const IdiomPaper = ({ items }: { items: TSubjectItem[] }) => {
  const [answers, setAnswers] = useState<number[]>(() => items.map(() => -1));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(-1);
  const [currentItems, setCurrentItems] = useState(items);
  // countdown：3-2-1 倒计时遮罩；playing：作答中并开始计时；done：已交卷
  const [phase, setPhase] = useState<"countdown" | "playing" | "done">(
    "countdown",
  );
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [seconds, setSeconds] = useState(0);

  // 重新生成后 items 会换一批，这里同步重置（含倒计时与用时）
  if (currentItems !== items) {
    setCurrentItems(items);
    setAnswers(items.map(() => -1));
    setIndex(0);
    setPicked(-1);
    setPhase("countdown");
    setCountdown(COUNTDOWN_FROM);
    setSeconds(0);
  }

  const total = items.length;
  const finished = total > 0 && index >= total;

  // 3-2-1 倒计时，归零后进入作答阶段
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      return;
    }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // 作答过程中计时，交卷后停表
  useEffect(() => {
    if (phase !== "playing" || finished) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [phase, finished]);

  if (finished && phase !== "done") {
    setPhase("done");
  }

  if (total === 0) {
    return <p className="text-[13px] text-gray-400">暂时没有内容</p>;
  }

  const pick = (optionIndex: number) => {
    if (phase !== "playing" || picked >= 0) return; // 倒计时中 / 连点都忽略
    setPicked(optionIndex);
    setAnswers((prev) =>
      prev.map((value, i) => (i === index ? optionIndex : value)),
    );
    setTimeout(() => {
      setPicked(-1);
      setIndex((current) => current + 1);
    }, NEXT_DELAY_MS);
  };

  const restart = () => {
    setAnswers(items.map(() => -1));
    setIndex(0);
    setPicked(-1);
    setCountdown(COUNTDOWN_FROM);
    setSeconds(0);
    setPhase("countdown");
  };

  if (finished) {
    return (
      <IdiomResult
        items={items}
        answers={answers}
        usedSeconds={seconds}
        onRestart={restart}
      />
    );
  }

  const item = items[index];
  const options = itemOptions(item);
  const stem = itemText(item, "stem");
  const [blankHead, blankTail] = stem.split("__");
  const hasBlank = stem.includes("__");
  // 看释义选成语没有空位；模型偶尔把 type 写错时按题干里有没空位兜底
  const isMean = itemText(item, "type") === "mean" || !hasBlank;

  const optionSize = isMean
    ? "px-[18px] py-2.5 text-[24px]"
    : "px-[26px] py-3 text-[33px]";

  return (
    <div className="flex flex-col gap-4">
      {/* 进度条：对照原型 .prac-head 的渐变条（左侧题号 + 右侧计时） */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#a855f7] px-4 py-2.5 text-white h-[60px]">
        <span className="text-[18px] leading-none font-bold">
          第 {index + 1}/{total} 题
        </span>
        <span className="text-[18px] leading-none font-bold tabular-nums">
          ⏱ {formatTime(seconds)}
        </span>
      </div>

      <div className="rounded-2xl bg-white px-[18px] py-[22px] shadow-sm">
        {isMean ? (
          <div className="text-[22px] leading-[1.8] text-[#37455e]">{stem}</div>
        ) : (
          <div
            className={`text-center block relative text-[48px] leading-[1.5] font-bold text-[#1c2333] ${KAI_FONT} flex items-center justify-center gap-1.5`}
          >
            {blankHead}
            {hasBlank ? (
              <div className="w-[48px] ">
                {picked >= 0 ? <div>{options[picked] ?? ""}</div> : "__"}
              </div>
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
                className={`w-full rounded-2xl border-[1.5px] text-center transition-colors ${KAI_FONT} ${optionSize} ${
                  active
                    ? "border-[#2563EB] bg-[#eaf1ff] font-bold text-[#2563EB]"
                    : "border-transparent bg-[#f1f4fa] text-[#5a6478]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* 倒计时遮罩：对照原型 .idiom-countdown */}
      {phase === "countdown" ? <CountdownOverlay seconds={countdown} /> : null}
    </div>
  );
};

/**
 * 倒计时遮罩：对应原型 .idiom-countdown。
 * 数字每秒换一次，换的时候做一次 scale 弹入（原型用 idiomPop 关键帧，
 * 这里用 Tailwind 的 transition 实现，避免往 globals.css 加自定义动画）。
 */
const CountdownOverlay = ({ seconds }: { seconds: number }) => {

  const [entryStyle, setEntryStyle] = useState<React.CSSProperties>({});
  // 每秒换一个数字：先回到 scale-50 再弹到 scale-100，形成一次弹入
  useEffect(() => {

    setEntryStyle({
        transform: "scale(0.5)",
    });
   setTimeout(() => {
    setEntryStyle({
      transform: "scale(2)",
      transition: "transform 0.15s ease-out",
    });
   },100)
  }, [seconds]);

  // 用 portal 挂到 body：外层滑动轨道带 transform，直接 fixed 会以轨道为基准（不在屏幕正中）
  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#101828]/50">
      <span
        className={cn(
          "flex h-[120px] w-[120px] scale-50 items-center justify-center text-[96px] leading-none font-extrabold text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.35)]",
        )}
        style={entryStyle}
      >
        {seconds}
      </span>
    </div>,
    document.body,
  );
};

/** 批改页：答对题数 + 每题对错，错题给出正确答案 */
const IdiomResult = ({
  items,
  answers,
  usedSeconds,
  onRestart,
}: {
  items: TSubjectItem[];
  answers: number[];
  usedSeconds: number;
  onRestart: () => void;
}) => {
  const results = items.map((item, i) => {
    const options = itemOptions(item);
    const answer = itemText(item, "answer");
    const chosen = answers[i];
    const your = chosen >= 0 ? (options[chosen] ?? "") : "未作答";
    return {
      no: i + 1,
      stem: itemText(item, "stem"),
      your,
      correct: answer,
      ok: chosen >= 0 && your.trim() === answer.trim(),
    };
  });

  const total = results.length;
  const right = results.filter((result) => result.ok).length;
  const wrongs = results.filter((result) => !result.ok);
  const rate = total ? Math.round((right / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="rounded-2xl bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#a855f7] p-5 text-center text-white shadow-[0_6px_18px_rgba(99,102,241,0.3)]">
        <div className="flex items-end justify-center gap-1 text-[16px] font-bold">
          <span className="leading-none">答对</span>
          <b className="text-[54px] leading-none">{right}</b>
          <span className="leading-none">/ {total} 题</span>
        </div>
        <div className="mt-1.5 text-[13px] opacity-90">
          正确率 {rate}% · 用时 {formatTime(usedSeconds)}
        </div>
      </div>

      {wrongs.length === 0 ? (
        <div className="rounded-xl bg-white px-3.5 py-3 text-center text-[14px] font-bold text-[#16a34a] shadow-sm">
          🎉 全部答对，太棒了！
        </div>
      ) : (
        <div className="px-1 text-[13px] font-bold text-[#dc2626]">
          错题回顾（{wrongs.length} 题）
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {results.map((result) => (
          <div
            key={result.no}
            className="rounded-xl bg-white px-3.5 py-3 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <span className="flex-1 text-[14px] font-bold text-[#1c2333]">
                {result.no}. {result.stem}
              </span>
              <span
                className={`text-[15px] font-bold ${
                  result.ok ? "text-[#16a34a]" : "text-[#dc2626]"
                }`}
              >
                {result.ok ? "✓" : "✗"}
              </span>
            </div>
            {result.ok ? null : (
              <div className="mt-1.5 text-[12px] leading-[1.7] text-gray-500">
                <span className="font-bold text-[#dc2626]">✗</span> 你的答案：
                <b>{result.your}</b> · 正确答案：
                <span className="font-bold text-[#16a34a]">
                  {result.correct}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-1 h-11 rounded-xl bg-blue-600 text-sm font-semibold text-white active:scale-[0.99]"
      >
        再做一遍
      </button>
    </div>
  );
};
