"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import qrCodeImage from "@/assets/whalepea_qrcode.jpg";
import { cn } from "@/utils/cn";

/**
 * 结果页左上角的二维码，直接用 src/assets/whalepea_qrcode.jpg。
 *
 * 导出 PDF / Word 时是把卷面 HTML 交给后端渲染的，那边访问不到我们站点的
 * 静态资源 URL，`<img src="/_next/static/...">` 会加载失败、图片是裂的。
 * 所以这里先在浏览器里把这张图读成 base64 data URL 再挂上去，
 * 导出的 HTML 就自带图片了。
 *
 * 源图 258×258，按 258 渲染再缩到 58px 显示，打印时也清晰。
 */
export const QrCode = ({ className }: { className?: string }) => {
  // 先用原始 URL 渲染，转成 base64 后替换（base64 是 data URL，next/image 会直接透传）
  const [src, setSrc] = useState<string>(qrCodeImage.src);

  useEffect(() => {
    let cancelled = false;

    const toDataUrl = async () => {
      try {
        const response = await fetch(qrCodeImage.src);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        if (!cancelled) setSrc(dataUrl);
      } catch {
        // 转换失败就保留原 URL，页面上依旧能正常显示
      }
    };

    void toDataUrl();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-lg border border-gray-200 bg-white p-1",
        className,
      )}
    >
      <Image
        src={src}
        alt="鲸鱼擦除君二维码"
        width={258}
        height={258}
        className="h-[58px] w-[58px] rounded"
      />
    </span>
  );
};
