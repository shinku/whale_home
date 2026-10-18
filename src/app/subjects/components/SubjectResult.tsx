"use client";

import { useEffect, useRef, useState } from "react";

import { Modal } from "antd";

import { cn } from "@/utils/cn";
import { isMiniProgram, jumpBakToMini } from "@/utils/wx";
import type { TSubjectResult } from "../result";
import { DEFAULT_DOC_STRATEGY, type TSubject } from "../subjects";
import { SubjectPaper } from "./SubjectPaper";
import { elementToExportHtml } from "./paperToHtml";

/** 文件直链前缀：上游返回的是 OSS 对象名（pub/xxx.pdf），需要拼上域名 */
const FILE_HOST = "https://fms.whalepea.com/";

type TStatus = "idle" | "loading" | "error";

/**
 * 结果页的客户端部分：渲染卷面 + 保存为 PDF / Word。
 *
 * 数据由详情页（server component）按 requestid SSR 取好后传进来，
 * 这里只负责展示与导出，不再自己请求内容。
 */
export const SubjectResult = ({
  subject,
  result,
  rawText = "",
  userId = "",
}: {
  subject: TSubject;
  /** 解析后的结构化结果；模型输出不是约定格式时为 null，改用 rawText 兜底 */
  result: TSubjectResult | null;
  /** 模型返回的原文，解析失败时直接展示 */
  rawText?: string;
  /** 小程序 userId / openid，导出时当 x-user-id */
  userId?: string;
}) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<TStatus>("idle");
  const [message, setMessage] = useState("");
  /** 正在导出的动作，用来给对应按钮显示「生成中...」并锁住两个按钮 */
  const [pendingAction, setPendingAction] = useState<"pdf" | "word" | null>(
    null,
  );
  /** 「保存为 Word」前的不可编辑提示 */
  const [docNoticeOpen, setDocNoticeOpen] = useState(false);

  /**
   * 打开生成好的文件。上游返回的是 OSS 对象名（pub/xxx.pdf）：
   * 微信小程序 webview 里（wx.miniProgram 可用）把对象名交给小程序跳转处理，
   * 普通 PC / 手机浏览器拼直链后开新窗口预览。
   */
  const openFile = (name: string, fileName: string) => {
    if (isMiniProgram()) {
      jumpBakToMini([{ name, link: fileName }]);
    } else {
      window.open(FILE_HOST + fileName, "_blank", "noopener,noreferrer");
    }
  };

  /**
   * 导出卷面（保存为 PDF / Word 共用）：
   * 把卷面 DOM 转成带内联样式的 HTML，交给 /api/convert 转发给上游生成文件，
   * 成功后按运行环境（小程序 / 普通浏览器）打开。
   */
  const exportPaper = async ({
    action,
    convertType,
    extension,
    label,
    extraBody,
  }: {
    /** 导出中锁按钮用的标记，同时也是按钮上的加载态 */
    action: "pdf" | "word";
    /** /api/convert 的转换类型，如 "html2pdf" / "html2doc" */
    convertType: string;
    /** 产物后缀，如 "pdf" / "docx" */
    extension: string;
    /** 提示文案里的名字，如 "PDF" / "Word" */
    label: string;
    /** 额外拼进请求体的参数（例如 PDF 的 printBackground） */
    extraBody?: Record<string, unknown>;
  }) => {
    const paper = paperRef.current;
    if (!paper) return;
    setPendingAction(action);
    setStatus("loading");
    setMessage("");

    try {
      const html = elementToExportHtml(paper);

      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({ convertType, html, ...extraBody }),
      });
      const body = (await response.json()) as {
        data?: string;
        error?: string;
      };

      if (!response.ok || !body?.data) {
        throw new Error(body?.error || `${label} 生成失败，请稍后重试`);
      }

      openFile(`${subject.title}.${extension}`, body.data);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : `${label} 生成失败，请稍后重试`,
      );
    } finally {
      setPendingAction(null);
    }
  };

  /** 保存为 PDF：上游 html_to_pdf（无头 Chromium 打印） */
  const savePdf = () =>
    exportPaper({
      action: "pdf",
      convertType: "html2pdf",
      extension: "pdf",
      label: "PDF",
      extraBody: { printBackground: true },
    });

  /** 当前学科保存为 Word 用的转换策略（可在学科配置里用 docStrategy 覆盖） */
  const docStrategy = subject.docStrategy ?? DEFAULT_DOC_STRATEGY;

  /** 保存为 Word：上游 html_to_doc */
  const saveWord = () =>
    exportPaper({
      action: "word",
      convertType: "html2doc",
      extension: "docx",
      label: "Word",
      extraBody: { toStrategy: docStrategy },
    });

  /**
   * 点「保存为 Word」：pdfkit-convert 是把每页渲染成图片塞进 docx，
   * 产物不可编辑，先弹提示让用户知情；regural 本身是可编辑文档，直接导出。
   */
  const handleSaveWord = () => {
    if (docStrategy === "pdfkit-convert") {
      setDocNoticeOpen(true);
      return;
    }
    void saveWord();
  };

  // 模型没按约定格式输出 JSON：直接把原文摊开展示
  if (!result) {
    return (
      <div className="mx-auto w-full max-w-[794px] px-4 pt-6 pb-16">
        <p className="text-sm text-gray-500">
          返回内容不是约定的 JSON 格式，已按原文展示
        </p>
        <pre className="mt-4 max-h-[70vh] overflow-auto rounded-xl border border-gray-200 bg-white p-4 text-xs whitespace-pre-wrap text-gray-600">
          {rawText}
        </pre>
      </div>
    );
  }

  // 不需要导出的学科（例如成语填空的即时填字）这里就不渲染按钮
  const [showExport,setShowExport] = useState(() => subject.showExport !== false);
  useEffect(()=>{
    if(isMiniProgram()) {
      setShowExport(false)
      return
    }
    setShowExport(subject.showExport !== false)
  },[subject])
  return (
    <div className="mx-auto w-full max-w-[794px] px-4 pt-6 pb-16">
      <div className="flex flex-col gap-3">
        {/* 用 ref 框住卷面，保存为 PDF 时截取这一块 */}
        <div ref={paperRef}>
          <SubjectPaper subject={subject} result={result} />
        </div>

        {showExport ? (
          <>
            <div className="flex gap-3 print:hidden">
              <button
                type="button"
                onClick={savePdf}
                disabled={pendingAction !== null}
                className="h-12 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pendingAction === "pdf" ? "生成中..." : "保存为 PDF"}
              </button>
              <button
                type="button"
                onClick={handleSaveWord}
                disabled={pendingAction !== null}
                className="h-12 flex-1 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 disabled:opacity-60"
              >
                {pendingAction === "word" ? "生成中..." : "保存为 Word"}
              </button>
            </div>

            {message ? (
              <p
                className={cn(
                  "text-center text-sm print:hidden",
                  status === "error" ? "text-red-500" : "text-gray-500",
                )}
              >
                {message}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {/* pdfkit-convert 导出的是整页图片形式的 docx，这里先说明不可编辑 */}
      <Modal
        open={docNoticeOpen}
        title="保存为 Word"
        okText="继续导出"
        cancelText="取消"
        onOk={() => {
          setDocNoticeOpen(false);
          void saveWord();
        }}
        onCancel={() => setDocNoticeOpen(false)}
      >
        为了保证高保真还原度，导出的 doc 为不可编辑状态。
      </Modal>
    </div>
  );
};
