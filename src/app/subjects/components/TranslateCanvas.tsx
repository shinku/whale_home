"use client";

import { useEffect, useState } from "react";

import {
  TRANSLATE_FALLBACK_COLOR,
  type TTranslateBlock,
} from "../translate/types";
import {
  calculateImageSize,
  TRANSLATE_IMAGE_WIDTH,
} from "../translate/image";

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    for (const character of Array.from(paragraph)) {
      const next = line + character;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
};

export type TCanvasTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

/** 将解析坐标系等比居中映射到输出 Canvas。 */
export const calculateCanvasTransform = ({
  canvasWidth,
  canvasHeight,
  imageWidth,
  imageHeight,
}: {
  canvasWidth: number;
  canvasHeight: number;
  imageWidth: number;
  imageHeight: number;
}): TCanvasTransform => {
  const referenceWidth = imageWidth > 0 ? imageWidth : canvasWidth;
  const referenceHeight = imageHeight > 0 ? imageHeight : canvasHeight;
  const scale = Math.min(
    canvasWidth / Math.max(1, referenceWidth),
    canvasHeight / Math.max(1, referenceHeight),
  );
  return {
    scale,
    offsetX: (canvasWidth - referenceWidth * scale) / 2,
    offsetY: (canvasHeight - referenceHeight * scale) / 2,
  };
};

const drawBlock = (
  ctx: CanvasRenderingContext2D,
  block: TTranslateBlock,
  transform: TCanvasTransform,
) => {
  const x = transform.offsetX + block.rect.x * transform.scale;
  const y = transform.offsetY + block.rect.y * transform.scale;
  const width = block.rect.w * transform.scale;
  const height = block.rect.h * transform.scale;
  if (!width || !height || !block.message.trim()) return;

  ctx.fillStyle = block.background;
  ctx.fillRect(x, y, width, height);

  const padding = Math.min(3, Math.max(1, height * 0.08));
  const maxWidth = Math.max(1, width - padding * 2);
  const maxHeight = Math.max(1, height - padding * 2);
  const fontSize = Math.max(1, block.fontSize * transform.scale);
  const lineHeight = fontSize * 1.15;
  ctx.font = `600 ${fontSize}px sans-serif`;
  const lines = wrapText(ctx, block.message.trim(), maxWidth);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + padding, y + padding, maxWidth, maxHeight);
  ctx.clip();
  ctx.fillStyle = /^#[0-9a-f]{6}$/i.test(block.color)
    ? block.color
    : TRANSLATE_FALLBACK_COLOR;
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textBaseline = "top";
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  lines.slice(0, maxLines).forEach((line, index) => {
    ctx.fillText(line, x + padding, y + padding + index * lineHeight);
  });
  ctx.restore();
};

/** 远程 source 必须走同源 imgget 代理，避免 Canvas 直接访问对象存储地址。 */
export const resolveTranslateImageSource = (image: string) => {
  if (image.startsWith("data:image/")) return image;
  if (/^https?:\/\//i.test(image)) {
    return `/api/imgget?url=${encodeURIComponent(image)}`;
  }
  return `data:image/jpeg;base64,${image}`;
};

/** 把接口返回的译文按原图像素坐标覆盖绘制到 Canvas。 */
export const TranslateCanvas = ({
  image,
  blocks,
  imageWidth = 0,
  imageHeight = 0,
}: {
  image: string;
  blocks: TTranslateBlock[];
  imageWidth?: number;
  imageHeight?: number;
}) => {
  const [error, setError] = useState("");
  const [renderedImage, setRenderedImage] = useState("");

  useEffect(() => {
    if (!image) return;
    setRenderedImage("");
    setError("");

    const imageSource = resolveTranslateImageSource(image);
    const source = new Image();
    source.onload = () => {
      const referenceWidth =
        imageWidth > 0 ? imageWidth : source.naturalWidth;
      const referenceHeight =
        imageHeight > 0 ? imageHeight : source.naturalHeight;
      const size = calculateImageSize({
        naturalWidth: referenceWidth,
        naturalHeight: referenceHeight,
        targetWidth: TRANSLATE_IMAGE_WIDTH,
      });
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("当前浏览器不支持 Canvas");
        return;
      }

      const transform = calculateCanvasTransform({
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imageWidth: referenceWidth,
        imageHeight: referenceHeight,
      });
      ctx.drawImage(
        source,
        transform.offsetX,
        transform.offsetY,
        referenceWidth * transform.scale,
        referenceHeight * transform.scale,
      );
      blocks.forEach((block) => drawBlock(ctx, block, transform));
      setRenderedImage(canvas.toDataURL("image/png"));
      setError("");
    };
    source.onerror = () => setError("图片加载失败");
    source.src = imageSource;

    return () => {
      source.onload = null;
      source.onerror = null;
    };
  }, [blocks, image, imageHeight, imageWidth]);

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!renderedImage) {
    return (
      <div className="flex min-h-40 items-center justify-center  bg-gray-50 text-sm text-gray-400">
        正在生成翻译图片...
      </div>
    );
  }

  return (
    <div>
      {/* Canvas 已按固定 800px 宽绘制完成，最终以 Base64 图片展示。 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={renderedImage}
        alt="拍照翻译结果"
        className="block h-auto w-full rounded-[2px] border border-gray-200 bg-white"
      />


    </div>
  );
};
