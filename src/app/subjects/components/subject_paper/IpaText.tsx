"use client";

import "@fontsource/charis-sil/400.css";

import { SoundOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";
import { Button } from "antd";

/**
 * 音标展示 + 发音。
 *
 * 字形用第三方音标字体 Charis SIL（@fontsource/charis-sil，SIL 专为 IPA 设计），
 * 避免在 Windows / Android 默认字体缺 ə、ʊ、ˈ 这类 IPA 字形时出现方框或字形不一致；
 * 字体按 unicode-range 分片，只下载用到的子集。
 *
 * 发音按钮用 antd 的 SoundOutlined 图标 + 浏览器 SpeechSynthesis，
 * 读的是英文单词本身（直接把 IPA 交给语音合成会被读成乱码）。
 */
export const IpaText = ({
  ipa,
  speakText,
  className,
}: {
  ipa?: string;
  /** 发音按钮要朗读的英文单词，不传则只展示不发音 */
  speakText?: string;
  className?: string;
}) => {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  // SSR 阶段没有 speechSynthesis，挂载后再判断是否显示发音按钮
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  const speak = () => {
    if (!supported || !speakText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!ipa) return null;

  const canSpeak = supported && Boolean(speakText);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5",
        className,
      )}
    >
      <span className="font-[Charis_SIL,Gentium_Plus,Doulos_SIL,Lucida_Sans_Unicode,Segoe_UI,sans-serif] tracking-[0.5px] text-[#6366f1]">
        {ipa}
      </span>
      {canSpeak ? (
        <Button
          icon={<SoundOutlined />}
          className="overflow-hidden rounded-lg"
          loading={speaking}
          onClick={speak}
          type="link"
        />
      ) : null}
    </span>
  );
};
