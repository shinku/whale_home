import { itemText, type TSubjectItem } from "../../result";

/** 列表渲染用的 key，取该学科的关键字段，避免重复 key */
export const itemKey = (item: TSubjectItem, index: number, key: string) =>
  `${index}-${itemText(item, key) || "item"}`;

/** 把 items 按每页 size 条切分（字帖按页、公式按页排版用） */
export const chunk = <T>(list: T[], size: number) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, index) =>
    list.slice(index * size, index * size + size),
  );
