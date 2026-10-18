/**
 * 把卷面 DOM 转成「自带样式」的 HTML，交给后端的 html_to_pdf / html_to_doc 转换。
 *
 * 为什么要把样式内联：导出的是独立的 HTML 片段，Tailwind 的 class 在那边没有
 * 样式表可依赖；而且 html_to_doc 的转换器不解析 <style> 选择器，只认行内 style。
 * 所以这里遍历整棵子树，把每个节点的计算样式按白名单写进 style 属性。
 */

/**
 * 后端按 A4 排版（左右各 10mm 边距），正文宽度 = 210 - 20 = 190mm ≈ 718px。
 * 导出前先把卷面临时收到这个宽度，让所有子节点按「打印宽度」重新布局后再取样式，
 * 否则在宽屏上量到的 794px 宽度会比正文区宽，右侧会被裁掉。
 */
export const PRINT_CONTENT_WIDTH_PX = 718;

/**
 * 导出时要保留的样式属性（Tailwind 卷面会用到的排版 / 盒模型 / 视觉属性）。
 * getComputedStyle 会返回几百个长属性，全部内联会让 HTML 体积膨胀好几倍，
 * 这里只挑真正影响卷面呈现的，需要时再往列表里加。
 */
export const EXPORT_STYLE_PROPERTIES: readonly string[] = [
  // 文字排版
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "font-variant-numeric",
  "font-feature-settings",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-align",
  "text-indent",
  "text-transform",
  "text-decoration-line",
  "text-decoration-style",
  "text-decoration-color",
  "text-underline-offset",
  "white-space",
  "word-break",
  "overflow-wrap",
  "direction",
  "vertical-align",
  "color",
  // 盒模型 / 定位
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "float",
  "clear",
  "box-sizing",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "overflow",
  "visibility",
  "opacity",
  // flex / grid / 分栏
  "flex-basis",
  "flex-direction",
  "flex-grow",
  "flex-shrink",
  "flex-wrap",
  "justify-content",
  "align-items",
  "align-content",
  "align-self",
  "order",
  "row-gap",
  "column-gap",
  "grid-template-columns",
  "grid-template-rows",
  "grid-auto-flow",
  "grid-column",
  "grid-row",
  "column-count",
  "column-width",
  "break-inside",
  "page-break-inside",
  // 边框 / 背景
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "background-color",
  "background-image",
  "background-position",
  "background-size",
  "background-repeat",
  "background-clip",
  "box-shadow",
  // 列表 / 表格 / 其它
  "list-style-type",
  "list-style-position",
  "border-collapse",
  "border-spacing",
  "table-layout",
  "transform",
  "transform-origin",
  "object-fit",
];

/**
 * 按白名单把样式序列化成 style 属性的值，空值跳过。
 * 纯函数（read 由调用方提供），方便单测。
 */
export const serializeStyles = (read: (property: string) => string) =>
  EXPORT_STYLE_PROPERTIES.map((property) => {
    const value = read(property);
    return value ? `${property}:${value}` : "";
  })
    .filter(Boolean)
    .join(";");

/** 把 source 的计算样式写进 target 的 style 属性 */
const applyComputedStyle = (source: Element, target: HTMLElement) => {
  const computed = window.getComputedStyle(source);
  target.setAttribute(
    "style",
    serializeStyles((property) => computed.getPropertyValue(property)),
  );
};

/**
 * Tailwind 的 before: / after: 实用类画的是伪元素（例如田字格的虚线十字），
 * 导出后没有样式表，伪元素会直接消失；这里把它落成一个真实子元素。
 */
const materializePseudoElement = (
  source: Element,
  target: HTMLElement,
  which: "::before" | "::after",
  prepend: boolean,
) => {
  const pseudo = window.getComputedStyle(source, which);
  const content = pseudo?.getPropertyValue("content");
  if (!content || content === "none" || content === "normal") return;

  const span = document.createElement("span");
  span.setAttribute(
    "style",
    serializeStyles((property) => pseudo.getPropertyValue(property)),
  );

  if (prepend) {
    target.insertBefore(span, target.firstChild);
  } else {
    target.appendChild(span);
  }
};

/** 递归遍历 source / target 两棵结构相同的树，把样式内联到 target */
const inlineTree = (source: Element, target: Element) => {
  applyComputedStyle(source, target as HTMLElement);

  // 先配对子节点再递归：伪元素是之后才插入 target 的，不能影响这里的下标对应
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) inlineTree(child, targetChild);
  });

  materializePseudoElement(source, target as HTMLElement, "::before", true);
  materializePseudoElement(source, target as HTMLElement, "::after", false);
};

/** 把卷面 DOM 转成带内联样式的 HTML 字符串 */
export const elementToExportHtml = (element: HTMLElement) => {
  const previousWidth = element.style.width;
  const previousMaxWidth = element.style.maxWidth;
  element.style.width = `${PRINT_CONTENT_WIDTH_PX}px`;
  element.style.maxWidth = `${PRINT_CONTENT_WIDTH_PX}px`;

  try {
    const clone = element.cloneNode(true) as HTMLElement;
    inlineTree(element, clone);
    return clone.outerHTML;
  } finally {
    // 恢复原样，避免影响页面上的卷面（同步执行，不会触发重绘）
    element.style.width = previousWidth;
    element.style.maxWidth = previousMaxWidth;
  }
};
