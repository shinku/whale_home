export const TRANSLATE_IMAGE_WIDTH = 800;

export const calculateImageSize = ({
  naturalWidth,
  naturalHeight,
  targetWidth = TRANSLATE_IMAGE_WIDTH,
}: {
  naturalWidth: number;
  naturalHeight: number;
  targetWidth?: number;
}) => {
  const width = Math.max(1, Math.floor(targetWidth));
  const height = Math.max(
    1,
    Math.round((naturalHeight * width) / Math.max(1, naturalWidth)),
  );
  return { width, height };
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = src;
  });

/** 统一重画为 800px 宽，高度按原图比例计算。 */
export const imageFileToTranslateDataUrl = async (file: File) => {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const size = calculateImageSize({
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  });
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持 Canvas");

  ctx.drawImage(image, 0, 0, size.width, size.height);
  return canvas.toDataURL(
    file.type === "image/png" ? "image/png" : "image/jpeg",
    0.9,
  );
};
