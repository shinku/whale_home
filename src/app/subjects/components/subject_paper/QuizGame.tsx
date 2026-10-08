"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";

import { cn } from "@/utils/cn";

/** 选中后停留一会儿再跳下一题，跟原型 pickIdiom / pickWord 的 420ms 一致 */
const NEXT_DELAY_MS = 420;
/** 进入练习前的倒计时秒数，对应原型 runIdiomCountdown 的 3-2-1 */
const COUNTDOWN_FROM = 3;

export type TQuizAnswer = {
  /** 展示用的作答内容（选项文本 / 拼写的单词） */
  text: string;
  correct: boolean;
};

export type TQuizQuestionArgs = {
  index: number;
  total: number;
  /** 倒计时中或正在切题：此时不接受作答 */
  locked: boolean;
  /** 提交作答：记录对错并自动跳到下一题 */
  answer: (result: TQuizAnswer) => void;
};

type TQuizGameProps<T> = {
  items: T[];
  /** 结果页每行显示的题干 */
  getLabel: (item: T, index: number) => string;
  /** 正确答案，结果页错题展示用 */
  getCorrect: (item: T) => string;
  /** 当前题目的卡片内容（题干 + 作答区），由各学科自己渲染 */
  renderQuestion: (item: T, args: TQuizQuestionArgs) => ReactNode;
  emptyText?: string;
};

/** 秒 -> mm:ss */
export const formatQuizTime = (seconds: number) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
};

/**
 * 即时答题游戏外壳（成语填空 / 背单词共用）：
 * 3-2-1 倒计时 → 一题一题作答（选中即跳下一题，同时计时）→ 批改页。
 *
 * 样式对照 sub_html/成语填空.html 的 .prac-head / .idiom-result-hero / .idiom-rev。
 */
export const QuizGame = <T,>({
  items,
  getLabel,
  getCorrect,
  renderQuestion,
  emptyText = "暂时没有内容",
}: TQuizGameProps<T>) => {
  const [answers, setAnswers] = useState<(TQuizAnswer | null)[]>(() =>
    items.map(() => null),
  );
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [currentItems, setCurrentItems] = useState(items);
  // countdown：3-2-1 遮罩；playing：作答中并计时；done：已交卷
  const [phase, setPhase] = useState<"countdown" | "playing" | "done">(
    "countdown",
  );
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [seconds, setSeconds] = useState(0);

  // 重新生成后 items 会换一批，这里同步重置（含倒计时与用时）
  if (currentItems !== items) {
    setCurrentItems(items);
    setAnswers(items.map(() => null));
    setIndex(0);
    setLocked(false);
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
    return <p className="text-[13px] text-gray-400">{emptyText}</p>;
  }

  const answer = (result: TQuizAnswer) => {
    if (phase !== "playing" || locked) return;
    setLocked(true);
    setAnswers((prev) =>
      prev.map((value, i) => (i === index ? result : value)),
    );
    setTimeout(() => {
      setLocked(false);
      setIndex((current) => current + 1);
    }, NEXT_DELAY_MS);
  };

  /** 回上一题：清掉那题的作答，允许重新作答 */
  const goBack = () => {
    if (index === 0 || locked || phase !== "playing") return;
    const target = index - 1;
    setAnswers((prev) => prev.map((value, i) => (i === target ? null : value)));
    setIndex(target);
  };

  const restart = () => {
    setAnswers(items.map(() => null));
    setIndex(0);
    setLocked(false);
    setCountdown(COUNTDOWN_FROM);
    setSeconds(0);
    setPhase("countdown");
  };

  if (finished) {
    return (
      <QuizResult
        items={items}
        answers={answers}
        usedSeconds={seconds}
        getLabel={getLabel}
        getCorrect={getCorrect}
        onRestart={restart}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 进度条：对照原型 .prac-head 的渐变条（左侧题号 + 右侧计时） */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#a855f7] px-4 py-2.5 text-white">
        <span className="text-[24px] leading-none font-bold">
          第 {index + 1} / {total} 题
        </span>
        <span className="text-[24px] leading-none font-bold tabular-nums">
          ⏱ {formatQuizTime(seconds)}
        </span>
      </div>

      {/* 用 key 保证换题时重建卡片，卡片内部的输入状态（如拼写）自动清空 */}
      <Fragment key={index}>
        {renderQuestion(items[index], {
          index,
          total,
          locked: locked || phase !== "playing",
          answer,
        })}
      </Fragment>
      {index !== 0 && (
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={index === 0 || locked || phase !== "playing"}
          onClick={goBack}
          className="mt-4"
          type="text"
        >
          返回上一题
        </Button>
      )}

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
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => setMounted(true), []);

  // 每秒换一个数字：先回到 scale-50 再弹到 scale-100，形成一次弹入
  useEffect(() => {
    setEntered(false);
    const timer = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(timer);
  }, [seconds]);

  if (!mounted) return null;

  // 用 portal 挂到 body：外层滑动轨道带 transform，直接 fixed 会以轨道为基准（不在屏幕正中）
  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#101828]/50">
      <span
        className={cn(
          "flex h-[120px] w-[120px] items-center justify-center text-[96px] leading-none font-extrabold text-white transition-transform duration-300 [text-shadow:0_4px_20px_rgba(0,0,0,0.35)]",
          entered ? "scale-100" : "scale-50",
        )}
      >
        {seconds}
      </span>
    </div>,
    document.body,
  );
};

/** 批改页：答对题数 + 每题对错，错题给出正确答案 */
const QuizResult = <T,>({
  items,
  answers,
  usedSeconds,
  getLabel,
  getCorrect,
  onRestart,
}: {
  items: T[];
  answers: (TQuizAnswer | null)[];
  usedSeconds: number;
  getLabel: (item: T, index: number) => string;
  getCorrect: (item: T) => string;
  onRestart: () => void;
}) => {
  const results = items.map((item, index) => {
    const answer = answers[index];
    return {
      no: index + 1,
      label: getLabel(item, index),
      your: answer?.text ?? "未作答",
      correct: getCorrect(item),
      ok: Boolean(answer?.correct),
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
          正确率 {rate}% · 用时 {formatQuizTime(usedSeconds)}
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
                {result.no}. {result.label}
              </span>
              <span
                className={cn(
                  "text-[15px] font-bold",
                  result.ok ? "text-[#16a34a]" : "text-[#dc2626]",
                )}
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

      <Button type="primary" onClick={onRestart} size="large">
        再做一遍
      </Button>
    </div>
  );
};
