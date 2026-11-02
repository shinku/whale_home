"use client";

import "@fontsource/charis-sil/400.css";

import { SoundOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";
import { cancelSpeech, isSpeechSupported, speakEnglish } from "@/utils/speech";
import { Button } from "antd";

/**
 * 音标展示 + 发音。
 *
 * 字形用第三方音标字体 Charis SIL（@fontsource/charis-sil，SIL 专为 IPA 设计），
 * 避免在 Windows / Android 默认字体缺 ə、ʊ、ˈ 这类 IPA 字形时出现方框或字形不一致；
 * 字体按 unicode-range 分片，只下载用到的子集。
 *
 * 发音按钮统一走 @/utils/speech，使用英式女声朗读英文单词本身
 * （直接把 IPA 交给语音合成会被读成乱码）。
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
  const requestIdRef = useRef(0);

  // SSR 阶段没有 speechSynthesis，挂载后再判断是否显示发音按钮
  useEffect(() => {
    setSupported(isSpeechSupported());
    return () => {
      requestIdRef.current += 1;
      cancelSpeech();
    };
  }, []);

  const speak = () => {
    if (!supported || !speakText) return;

    const requestId = ++requestIdRef.current;
    setSpeaking(true);
    try {
      speakEnglish(speakText, {
        onStart: () => setSpeaking(true),
        onEnd: () => {
          if (requestIdRef.current === requestId) setSpeaking(false);
        },
        onError: () => {
          if (requestIdRef.current === requestId) setSpeaking(false);
        },
      });
    } catch {
      setSpeaking(false);
    }
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
