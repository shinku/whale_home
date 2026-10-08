import { itemText, type TSubjectItem } from "../../result";

/**
 * 习题页统一字体：优先系统自带的黑体，不用宋体。
 * 依次是 macOS/iOS（PingFang SC）、老版 macOS（Hiragino Sans GB / Heiti SC）、
 * Windows（Microsoft YaHei）、Linux/Android（Noto Sans CJK SC / Source Han Sans SC）。
 */
export const EXERCISE_FONT =
  "font-[PingFang_SC,Hiragino_Sans_GB,Heiti_SC,Microsoft_YaHei,Noto_Sans_CJK_SC,Source_Han_Sans_SC,sans-serif]";

/** 列表渲染用的 key，取该学科的关键字段，避免重复 key */
export const itemKey = (item: TSubjectItem, index: number, key: string) =>
  `${index}-${itemText(item, key) || "item"}`;

/** 把 items 按每页 size 条切分（字帖按页、公式按页排版用） */
export const chunk = <T>(list: T[], size: number) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, index) =>
    list.slice(index * size, index * size + size),
  );
