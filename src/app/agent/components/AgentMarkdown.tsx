"use client";

import { useEffect, useRef, useState } from "react";

import { SoundOutlined } from "@ant-design/icons";
import { message as antdMessage } from "antd";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { cn } from "@/utils/cn";
import { speakEnglish } from "@/utils/speech";

import { getPronounceText, preparePronounceMarkdown } from "../pronounce";

/**
 * Agent 输出统一按 Markdown 渲染。react-markdown 默认不解析原始 HTML；
 * 这里保留该安全边界，不启用 rehype-raw。
 */
export const AgentMarkdown = ({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) => {
  const [playingText, setPlayingText] = useState<string | null>(null);
  const playbackIdRef = useRef(0);
  const activeIconRef = useRef<HTMLSpanElement>(null);
  const activeBackgroundRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const icon = activeIconRef.current;
    if (
      !icon ||
      typeof icon.animate !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const animation = icon.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18)" },
        { transform: "scale(0.92)" },
        { transform: "scale(1)" },
      ],
      {
        duration: 600,
        iterations: Infinity,
        easing: "ease-in-out",
      },
    );
    return () => animation.cancel();
  }, [playingText]);

  useEffect(() => {
    const background = activeBackgroundRef.current;
    if (
      !background ||
      typeof background.animate !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const animation = background.animate(
      [
        { backgroundPosition: "0% 50%" },
        { backgroundPosition: "200% 50%" },
      ],
      {
        duration: 1600,
        iterations: Infinity,
        easing: "linear",
      },
    );
    return () => animation.cancel();
  }, [playingText]);

  const speak = (text: string) => {
    const playbackId = ++playbackIdRef.current;
    try {
      speakEnglish(text, {
        onStart: () => {
          if (playbackIdRef.current === playbackId) setPlayingText(text);
        },
        onEnd: () => {
          if (playbackIdRef.current === playbackId) setPlayingText(null);
        },
        onError: () => {
          if (playbackIdRef.current === playbackId) setPlayingText(null);
        },
      });
    } catch (error) {
      if (playbackIdRef.current === playbackId) setPlayingText(null);
      antdMessage.warning(
        error instanceof Error ? error.message : "当前浏览器不支持语音朗读",
      );
    }
  };

  return (
    <div
    className={
      compact
        ? "text-[12px] leading-5 break-words text-gray-600 [&_a]:text-blue-600 [&_p]:mb-2 [&_p:last-child]:mb-0"
        : "text-[12px] leading-5 break-words text-gray-800 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-[3px] [&_blockquote]:border-gray-300 [&_blockquote]:px-3 [&_blockquote]:py-1 [&_blockquote]:text-gray-500 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_h1]:mt-5 [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-gray-950 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_td]:border [&_td]:border-gray-200 [&_td]:px-2.5 [&_td]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-2.5 [&_th]:py-1.5 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
    }
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      urlTransform={(url) =>
        url.startsWith("pronounce:") ? url : defaultUrlTransform(url)
      }
      components={{
        a: ({ href, title, children }) => {
          const pronounceText = href ? getPronounceText(href) : null;
          if (pronounceText) {
            const playing = playingText === pronounceText;
            return (
              <button
                type="button"
                title={title || `英式女声朗读 ${pronounceText}`}
                aria-label={`英式女声朗读 ${pronounceText}`}
                aria-pressed={playing}
                className={cn(
                  "relative mx-0.5 inline-flex max-w-full items-start gap-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-left align-baseline text-[12px] leading-5 font-medium transition",
                  playing
                    ? "border-transparent text-white"
                    : "border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100",
                )}
                onClick={() => speak(pronounceText)}
              >
                {playing ? (
                  <span
                    ref={activeBackgroundRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,#3b82f6,#6366f1,#a855f7,#3b82f6)] bg-[length:200%_100%] will-change-[background-position]"
                  />
                ) : null}
                <span
                  ref={playing ? activeIconRef : undefined}
                  className="relative z-10 inline-flex shrink-0"
                >
                  <SoundOutlined className="mt-1 text-[11px]" />
                </span>
                <span className="relative z-10 min-w-0 break-words">
                  {children}
                </span>
              </button>
            );
          }

          return (
            <a
              href={href}
              title={title}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt, title }) => (
          // Agent 返回的图片不在固定域名内，使用原生 img 避免 Next Image 域名约束。
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? ""}
            title={title}
            loading="lazy"
            className="my-3 block h-auto max-w-full rounded-lg"
          />
        ),
      }}
    >
      {preparePronounceMarkdown(content)}
    </ReactMarkdown>
    </div>
  );
};
