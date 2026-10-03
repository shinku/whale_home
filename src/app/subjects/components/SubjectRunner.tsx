"use client";

import { useMemo, useRef, useState } from "react";

import { isMiniProgram, miniProgramNavigateTo } from "@/utils/wx";
import { cn } from "@/utils/cn";
import {
  parseSubjectResult,
  subjectResultToText,
  type TSubjectResult,
} from "../result";
import {
  defaultOptions,
  type TSubject,
  type TSubjectOption,
} from "../subjects";
import {
  SubjectFragment,
  type TSubjectFragmentHandle,
} from "./SubjectFragment";
import { SubjectPaper } from "./SubjectPaper";

type TStatus = "idle" | "loading" | "error";

/**
 * 所有学科共用的「选选项 → AI 生成 → 展示结果」流程。
 * 结果页统一带有二维码、保存为 PDF、保存为 Word。
 */
export const SubjectRunner = ({ subject }: { subject: TSubject }) => {
  const fragmentRef = useRef<TSubjectFragmentHandle>(null);
  const [values, setValues] = useState(() => defaultOptions(subject));
  const [result, setResult] = useState<TSubjectResult | null>(null);
  const [fallbackText, setFallbackText] = useState("");
  const [status, setStatus] = useState<TStatus>("idle");
  const [message, setMessage] = useState("");

  /** 小程序 webview 里才会带 userId / openid 参数 */
  const userId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("userId") || params.get("openid") || "";
  }, []);

  const setValue = (key: string, value: string | string[]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const generate = async () => {
    setStatus("loading");
    setMessage("");
    setFallbackText("");

    try {
      const response = await fetch(`/api/subjects/${subject.slug}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({ options: values }),
      });
      const body = (await response.json()) as {
        data?: unknown;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body?.error || "生成失败，请稍后重试");
      }

      const parsed = parseSubjectResult(body?.data);
      if (!parsed) {
        setResult(null);
        setFallbackText(
          typeof body?.data === "string"
            ? body.data
            : JSON.stringify(body?.data ?? "", null, 2),
        );
        setStatus("error");
        setMessage("返回内容不是约定的 JSON 格式，已按原文展示");
        return;
      }

      setResult(parsed);
      setStatus("idle");
      // 生成完成：结果页滑入视窗
      fragmentRef.current?.showResult();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "生成失败，请稍后重试",
      );
    }
  };

  const saveWord = async () => {
    if (!result) return;
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/admin/doc", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          text: subjectResultToText(subject.slug, result, subject.resultTitle),
        }),
      });
      const body = (await response.json()) as { data?: string; error?: string };
      const link = body?.data;
      if (!link) throw new Error(body?.error || "Word 生成失败");

      const file = { name: `${subject.title}.docx`, link };
      if (isMiniProgram()) {
        miniProgramNavigateTo(
          "/pages/converResult/covert-result-page?list=" +
            JSON.stringify([file]),
        );
      } else {
        window.open(link, "_blank", "noopener,noreferrer");
      }
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Word 生成失败");
    }
  };

  /** 配置页（ConfigFragment 的内容） */
  const configPanel = (
    <div className="mx-auto w-full max-w-[794px] px-4 pt-6 pb-16">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">{subject.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subject.desc}</p>
        <p className="mt-1 text-xs text-gray-400">
          系统提示词：src/prompts/{subject.slug}.md
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
        {subject.options.map((option) => (
          <OptionField
            key={option.key}
            option={option}
            value={values[option.key]}
            disabled={status === "loading"}
            onChange={(next) => setValue(option.key, next)}
          />
        ))}

        <button
          type="button"
          onClick={generate}
          disabled={status === "loading"}
          className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white transition disabled:opacity-60"
        >
          {status === "loading" ? "生成中..." : "生成内容"}
        </button>

        {message ? (
          <p
            className={cn(
              "text-sm",
              status === "error" ? "text-red-500" : "text-gray-500",
            )}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );

  /** 结果页（ResultFragment 的内容） */
  const showExport = subject.showExport !== false;

  const resultPanel = (
    <div className="mx-auto w-full max-w-[794px] px-4 pt-6">
      {result ? (
        <div className="flex flex-col gap-3">
          <SubjectPaper subject={subject} result={result} />

          {/* 不需要导出的学科（例如成语填空的即时填字）这里就不渲染按钮 */}
          {showExport ? (
            <>
              <div className="flex gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={status === "loading"}
                  className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white disabled:opacity-60"
                >
                  保存为 PDF
                </button>
                <button
                  type="button"
                  onClick={saveWord}
                  disabled={status === "loading"}
                  className="h-12 flex-1 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 disabled:opacity-60"
                >
                  保存为 Word
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 print:hidden">
                保存为 PDF 会调用浏览器打印，选择「另存为 PDF」即可
              </p>
            </>
          ) : null}
        </div>
      ) : (
        <p className="pt-24 text-center text-sm text-gray-400">
          还没有生成内容，先回到配置页生成吧
        </p>
      )}

      {fallbackText ? (
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-gray-200 bg-white p-4 text-xs whitespace-pre-wrap text-gray-600 print:hidden">
          {fallbackText}
        </pre>
      ) : null}
    </div>
  );

  return (
    <SubjectFragment
      ref={fragmentRef}
      config={configPanel}
      result={resultPanel}
    />
  );
};

const OptionField = ({
  option,
  value,
  disabled,
  onChange,
}: {
  option: TSubjectOption;
  value: string | string[] | undefined;
  disabled: boolean;
  onChange: (value: string | string[]) => void;
}) => {
  if (option.type === "image") {
    return (
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">{option.label}</span>
        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange(String(reader.result ?? ""));
            reader.readAsDataURL(file);
          }}
          className="text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-600"
        />
        <span className="text-xs text-gray-400">
          {typeof value === "string" && value
            ? "已选择图片"
            : (option.hint ?? "未选择图片")}
        </span>
      </label>
    );
  }

  if (option.type === "text") {
    return (
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">{option.label}</span>
        <textarea
          rows={3}
          disabled={disabled}
          value={typeof value === "string" ? value : ""}
          placeholder={option.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </label>
    );
  }

  const choices = option.choices ?? [];
  const selected = Array.isArray(value) ? value : [value ?? ""];

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-gray-700">{option.label}</span>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const active = selected.includes(choice);
          return (
            <button
              key={choice}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!option.multiple) {
                  onChange(choice);
                  return;
                }
                const next = active
                  ? selected.filter((item) => item !== choice)
                  : [...selected, choice];
                onChange(next);
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] transition disabled:opacity-60",
                active
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-600",
              )}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {option.hint ? (
        <span className="text-xs text-gray-400">{option.hint}</span>
      ) : null}
    </div>
  );
};
