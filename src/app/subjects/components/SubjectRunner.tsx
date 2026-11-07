"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Select } from "antd";

import { DifficultySelector } from "@/components/DifficultySelector";
import { GenerateContentButton } from "@/components/GenerateContentButton";
import { PageSelector } from "@/components/PageSelector";
import { SubjectOptionButton } from "@/components/SubjectOptionButton";
import { cn } from "@/utils/cn";
import { imageFileToTranslateDataUrl } from "../translate/image";
import {
  normalizeTranslateDirection,
  type TTranslateApiResponse,
} from "../translate/types";
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
  const isTranslate = subject.slug === "translate";
  const translateImage =
    typeof values["图片"] === "string" ? values["图片"].trim() : "";
  const isGenerateDisabled = isTranslate && !translateImage;

  /** 小程序 webview 里才会带 userId / openid 参数（生成接口用它当 x-user-id） */
  const userId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("userId") || params.get("openid") || "";
  }, []);

  const setValue = (key: string, value: string | string[]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const generate = async () => {
    if (isGenerateDisabled) return;
    setStatus("loading");
    setMessage("");

    try {
      if (isTranslate) {
        const response = await fetch("/api/ai/subject/translate", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(userId ? { "x-user-id": userId } : {}),
          },
          body: JSON.stringify({
            source: translateImage,
            direction: normalizeTranslateDirection(values.direction),
          }),
        });
        const body = (await response
          .json()
          .catch(() => null)) as TTranslateApiResponse | null;

        if (
          !response.ok ||
          body?.status !== 200 ||
          typeof body.data?.source !== "string" ||
          !Array.isArray(body.data.result) ||
          !body.id
        ) {
          throw new Error(
            body?.error || body?.message || "图片翻译失败，请稍后重试",
          );
        }

        setStatus("idle");
        const showExport = isShowExport(subject.slug);
        if (isMiniProgram()) {
          // 小程序结果页使用 requestid 参数，这里把翻译结果 id 通过它透传。
          jumnToMiniProgramSubjectDetail(
            subject.slug,
            body.id,
            userId,
            showExport,
          );
          return;
        }
        const params = new URLSearchParams(window.location.search);
        params.delete("requestid");
        params.set("id", body.id);
        router.push(`/subjects/translate/detail?${params.toString()}`);
        return;
      }

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
      // 跳转前恢复按钮状态，避免返回生成页时按钮仍显示为禁用
      setStatus("idle");
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
            onImageError={(error) => {
              setStatus("error");
              setMessage(error);
            }}
          />
        ))}

        <GenerateContentButton
          onClick={generate}
          loading={status === "loading"}
          disabled={isGenerateDisabled}
          title={isGenerateDisabled ? "请先上传需要翻译的图片" : undefined}
        />

        {isTranslate && isGenerateDisabled ? (
          <p className="text-xs text-gray-400">
            请先上传图片，生成按钮才会启用。
          </p>
        ) : null}

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
  onImageError,
}: {
  option: TSubjectOption;
  value: string | string[] | undefined;
  disabled: boolean;
  onChange: (value: string | string[]) => void;
  onImageError: (message: string) => void;
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
            void imageFileToTranslateDataUrl(file)
              .then(onChange)
              .catch((error: unknown) =>
                onImageError(
                  error instanceof Error ? error.message : "图片处理失败",
                ),
              );
          }}
          className="text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-600"
        />
        {typeof value === "string" && value ? (
          <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="已上传图片预览"
              className="mx-auto block h-auto max-h-[420px] w-full object-contain"
            />
          </div>
        ) : null}
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

  if (option.type === "select") {
    return (
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-gray-700">{option.label}</span>
        <Select
          value={typeof value === "string" ? value : option.default.toString()}
          onChange={onChange}
          disabled={disabled}
          size="large"
          aria-label={option.label}
          className="w-full"
          options={(option.choices ?? []).map((choice) => ({
            value: choice,
            label: option.choiceLabels?.[choice] ?? choice,
          }))}
        />
        {option.hint ? (
          <span className="text-xs text-gray-400">{option.hint}</span>
        ) : null}
      </label>
    );
  }

  if (option.type === "page-selector") {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-gray-700">{option.label}</span>
        <PageSelector
          options={option.choices ?? []}
          value={typeof value === "string" ? value : option.default.toString()}
          onChange={onChange}
          unit={option.unit}
          disabled={disabled}
          label={option.label}
        />
        {option.hint ? (
          <span className="text-xs text-gray-400">{option.hint}</span>
        ) : null}
      </div>
    );
  }

  if (option.type === "difficulty-selector") {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-gray-700">{option.label}</span>
        <DifficultySelector
          options={option.choices ?? []}
          value={typeof value === "string" ? value : option.default.toString()}
          onChange={onChange}
          disabled={disabled}
          label={option.label}
        />
        {option.hint ? (
          <span className="text-xs text-gray-400">{option.hint}</span>
        ) : null}
      </div>
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
            <SubjectOptionButton
              key={choice}
              active={active}
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
            >
              {choice}
            </SubjectOptionButton>
          );
        })}
      </div>
      {option.hint ? (
        <span className="text-xs text-gray-400">{option.hint}</span>
      ) : null}
    </div>
  );
};
