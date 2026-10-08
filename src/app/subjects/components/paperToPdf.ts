/** A4 纸的高宽比（297 / 210），用来把整段长图按 A4 切页 */
export const A4_PAGE_RATIO = 297 / 210;

/** 单页切片：top 是整图里的起始像素，height 是这一页实际内容高度 */
export type TPageSlice = {
  top: number;
  height: number;
};

/**
 * 按 A4 比例把整图（宽 width、高 height）切成若干页。
 * 纯计算，方便单测；最后一页不足一屏时按内容高度返回，绘制时补白即可。
 */
export const splitIntoPages = (width: number, height: number) => {
  const pageHeight = Math.max(1, Math.round(width * A4_PAGE_RATIO));
  const slices: TPageSlice[] = [];

  for (let top = 0; top < height; top += pageHeight) {
    slices.push({ top, height: Math.min(pageHeight, height - top) });
  }

  return { pageHeight, slices };
};

/** 把整张长图逐页切成 base64 图片（data URL），顺序即 PDF 页序 */
export const canvasToBase64Pages = (canvas: HTMLCanvasElement) => {
  const { pageHeight, slices } = splitIntoPages(canvas.width, canvas.height);

  return slices.map(({ top, height }) => {
    const page = document.createElement("canvas");
    page.width = canvas.width;
    page.height = pageHeight;

    const pageContext = page.getContext("2d");
    if (!pageContext) return "";

    // 先铺白底，最后一页不足一屏时其余部分留白
    pageContext.fillStyle = "#ffffff";
    pageContext.fillRect(0, 0, page.width, page.height);
    pageContext.drawImage(
      canvas,
      0,
      top,
      canvas.width,
      height,
      0,
      0,
      canvas.width,
      height,
    );

    return page.toDataURL("image/png");
  });
};

/**
 * 把卷面 DOM 渲染成 base64 图片列表（每页一张）。
 *
 * 用 html2canvas-pro 而不是原版 html2canvas：Tailwind v4 会把调色板用
 * `lab()` 重声明（@supports (color: lab(0% 0 0))），计算值就是 lab(...)，
 * 原版 html2canvas 1.4.1 的颜色解析器不支持 lab/oklab/color-mix 会直接抛错。
 *
 * 只在浏览器里用，所以动态 import，避免在 node（测试/SSR）里加载。
 */
export const captureToBase64Pages = async (element: HTMLElement) => {
  const { default: html2canvas } = await import("html2canvas-pro");

  // 等字体加载完再截，避免音标等自定义字体截成方框
  await document.fonts?.ready;

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  return canvasToBase64Pages(canvas);
};
