"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { cn } from "@/utils/cn";
import {
  defaultOptions,
  isShowExport,
  type TSubject,
  type TSubjectOption,
} from "../subjects";
import { isMiniProgram, jumnToMiniProgramSubjectDetail } from "@/utils/wx";

type TStatus = "idle" | "loading" | "error";

/**
 * 子学科的配置页：选选项 → 调 `/api/subjects/<slug>` 生成。
 *
 * 生成成功后不在本页展示结果，而是带着返回的 requestid 跳到
 * `/subjects/<slug>/detail?requestid=xxx`：详情页 SSR 按 requestid 取数渲染，
 * 刷新 / 分享链接都能复现同一份结果。
 */
export const SubjectRunner = ({ subject }: { subject: TSubject }) => {
  const router = useRouter();
  const [values, setValues] = useState(() => defaultOptions(subject));
  const [status, setStatus] = useState<TStatus>("idle");
  const [message, setMessage] = useState("");

  /** 小程序 webview 里才会带 userId / openid 参数（生成接口用它当 x-user-id） */
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
        requestid?: string;
        error?: string;
      };

      if (!response.ok || !body?.requestid) {
        throw new Error(body?.error || "生成失败，请稍后重试");
      }
      const showExport = isShowExport(subject.slug);
      if (isMiniProgram()) {
        jumnToMiniProgramSubjectDetail(
          subject.slug,
          body.requestid,
          userId,
          showExport,
        );
        return;
      }
      // 详情页要凭 requestid 取数；把当前 query（含小程序 userId / openid）一起带过去
      const params = new URLSearchParams(window.location.search);
      params.set("requestid", body.requestid);
      router.push(`/subjects/${subject.slug}/detail?${params.toString()}`);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "生成失败，请稍后重试",
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-[794px] px-4 pt-6 pb-16">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">{subject.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subject.desc}</p>
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
