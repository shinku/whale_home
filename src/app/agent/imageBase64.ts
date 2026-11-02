const OUTPUT_WIDTH = 800;
const JPEG_QUALITY = 0.86;

/** 按固定宽度等比计算输出高度，至少保留 1px。 */
export const calculateImageHeight = (
  sourceWidth: number,
  sourceHeight: number,
  outputWidth = OUTPUT_WIDTH,
) => {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("图片尺寸无效");
  }
  return Math.max(1, Math.round((sourceHeight * outputWidth) / sourceWidth));
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片解析失败"));
    image.src = src;
  });

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("图片编码失败"));
    reader.readAsDataURL(blob);
  });

/**
 * 在浏览器内存中把图片缩放到宽 800px，并转为 JPEG data URL。
 * 优先使用 OffscreenCanvas；不支持时退回到未挂载到 DOM 的 canvas。
 */
export const imageFileToBase64 = async (
  file: File,
  outputWidth = OUTPUT_WIDTH,
) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("只支持图片文件");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const outputHeight = calculateImageHeight(
      image.naturalWidth,
      image.naturalHeight,
      outputWidth,
    );

    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(outputWidth, outputHeight);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("无法创建图片画布");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, outputWidth, outputHeight);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, outputWidth, outputHeight);

      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: JPEG_QUALITY,
      });
      return blobToDataUrl(blob);
    }

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法创建图片画布");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, outputWidth, outputHeight);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
