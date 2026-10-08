/**
 * subjects 下的公共配置：每个子学科（口算练习 / 竖式计算 / ...）的
 * 标题、入口描述、选项定义与对应的系统提示词文件。
 *
 * 约定：src/app/subjects/<slug>/page.tsx 与 src/prompts/<slug>.md 一一对应，
 * 新增学科时只要在这里加一条配置、补一个 page.tsx 和一份提示词即可。
 */

export type TSubjectSlug =
  | "arithmetic"
  | "vertical"
  | "copybook"
  | "idiom"
  | "translate"
  | "formula"
  | "words";

export type TSubjectOptionType = "chips" | "text" | "image";

export type TSubjectOption = {
  /** 提交给 AI 的字段名 */
  key: string;
  /** 表单里展示的标签 */
  label: string;
  type: TSubjectOptionType;
  /** chips 是否可多选 */
  multiple?: boolean;
  /** chips 的可选项 */
  choices?: string[];
  default: string | string[];
  placeholder?: string;
  hint?: string;
};

export type TSubject = {
  slug: TSubjectSlug;
  /** 页面标题，同时作为首页列表的标题 */
  title: string;
  /** 首页列表的一句话描述 */
  desc: string;
  emoji: string;
  /** 结果页卷面标题 */
  resultTitle: string;
  /** 结果页是否展示头部（二维码 + 品牌 + 标题/姓名栏），默认展示 */
  showPaperHeader?: boolean;
  /** 结果页是否展示「保存为 PDF / Word」，默认展示 */
  showExport?: boolean;
  options: TSubjectOption[];
};

const numberRange = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) =>
    String(from + i * step),
  );

export const SUBJECTS: TSubject[] = [
  {
    slug: "arithmetic",
    title: "口算练习",
    desc: "按年级难度生成口算练习卷，可打印",
    emoji: "3",
    resultTitle: "口算练习卷",
    options: [
      {
        key: "年级",
        label: "年级",
        type: "chips",
        choices: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
        default: "三年级",
      },
      {
        key: "难度",
        label: "难度",
        type: "chips",
        choices: ["简单", "中等", "困难"],
        default: "中等",
      },
      {
        key: "题型",
        label: "题型（可多选）",
        type: "chips",
        multiple: true,
        choices: ["加法", "减法", "乘法", "除法"],
        default: ["加法", "减法"],
      },
      {
        key: "题目数量",
        label: "题目数量",
        type: "chips",
        choices: numberRange(10, 100, 10),
        default: "20",
      },
    ],
  },
  {
    slug: "vertical",
    title: "竖式计算",
    desc: "生成竖式练习卷，支持逐步批改与 AI 讲解",
    emoji: "2",
    resultTitle: "竖式计算练习卷",
    options: [
      {
        key: "版本",
        label: "版本",
        type: "chips",
        choices: ["人教版", "苏教版", "北师大版"],
        default: "人教版",
      },
      {
        key: "年级",
        label: "年级",
        type: "chips",
        choices: ["二年级", "三年级", "四年级", "五年级"],
        default: "三年级",
      },
      {
        key: "册别",
        label: "册别",
        type: "chips",
        choices: ["上册", "下册"],
        default: "上册",
      },
      {
        key: "题目数量",
        label: "题目数量",
        type: "chips",
        choices: ["10", "20", "30"],
        default: "10",
      },
    ],
  },
  {
    slug: "copybook",
    title: "字帖本",
    desc: "按年级生成同步生字字帖，描红可打印",
    emoji: "字",
    resultTitle: "字帖本",
    options: [
      {
        key: "年级",
        label: "年级",
        type: "chips",
        choices: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
        default: "三年级",
      },
      {
        key: "页数",
        label: "页数（每页 20 字）",
        type: "chips",
        choices: numberRange(1, 10, 1),
        default: "1",
      },
    ],
  },
  {
    slug: "idiom",
    title: "成语填空",
    desc: "补字填空 / 看释义选成语，巩固积累",
    emoji: "文",
    resultTitle: "成语填空",
    // 即时填字游戏：不需要卷头（二维码/品牌/姓名栏），也不需要导出按钮
    showPaperHeader: false,
    showExport: false,
    options: [
      {
        key: "难度",
        label: "难度",
        type: "chips",
        choices: [
          "⭐（一二年级）",
          "⭐⭐（三四年级）",
          "⭐⭐⭐（五六年级）",
          "⭐⭐⭐⭐（初高中）",
        ],
        default: "⭐⭐（三四年级）",
      },
      {
        key: "题型",
        label: "题型",
        type: "chips",
        choices: ["补字填空", "看释义选成语"],
        default: "补字填空",
      },
      {
        key: "题目数量",
        label: "题目数量",
        type: "chips",
        choices: numberRange(10, 100, 10),
        default: "10",
      },
    ],
  },
  {
    slug: "translate",
    title: "拍照翻译",
    desc: "拍下作业或课本，逐句中英互译",
    emoji: "A",
    resultTitle: "拍照翻译",
    options: [
      {
        key: "源语言",
        label: "源语言",
        type: "chips",
        choices: ["自动识别", "中文", "英文"],
        default: "自动识别",
      },
      {
        key: "目标语言",
        label: "目标语言",
        type: "chips",
        choices: ["中文", "英文"],
        default: "中文",
      },
      {
        key: "图片",
        label: "拍照 / 上传图片",
        type: "image",
        default: "",
        hint: "支持 JPG / PNG，图片会随请求一起提交给翻译模型",
      },
      {
        key: "文字",
        label: "或直接粘贴文字",
        type: "text",
        default: "",
        placeholder: "没有图片时可以在这里输入要翻译的内容",
      },
    ],
  },
  {
    slug: "formula",
    title: "数学公式",
    desc: "按年级生成公式默写卷 / 公式集",
    emoji: "f(x)",
    resultTitle: "数学公式",
    options: [
      {
        key: "年级",
        label: "年级",
        type: "chips",
        choices: [
          "三年级",
          "四年级",
          "五年级",
          "六年级",
          "七年级",
          "八年级",
          "九年级",
          "高一",
          "高二",
          "高三",
        ],
        default: "三年级",
      },
      {
        key: "题目数量",
        label: "题目数量",
        type: "chips",
        choices: numberRange(5, 40, 5),
        default: "10",
      },
      {
        key: "模式",
        label: "模式",
        type: "chips",
        choices: ["默写", "背诵"],
        default: "默写",
      },
    ],
  },
  {
    slug: "words",
    title: "背单词",
    desc: "按学段生成英译中 / 中译英 / 拼写练习",
    emoji: "W",
    resultTitle: "单词练习",
    // 与成语填空一致：即时答题游戏，不需要卷头（二维码/品牌/姓名栏）与导出按钮
    showPaperHeader: false,
    showExport: false,
    options: [
      {
        key: "年级",
        label: "学段",
        type: "chips",
        choices: ["小学", "初中", "高中"],
        default: "小学",
      },
      {
        key: "题型",
        label: "题型",
        type: "chips",
        choices: ["英译中", "中译英", "拼写"],
        default: "英译中",
      },
      {
        key: "题目数量",
        label: "题目数量",
        type: "chips",
        choices: numberRange(10, 100, 10),
        default: "15",
      },
    ],
  },
];

export const getSubject = (slug: string): TSubject | undefined =>
  SUBJECTS.find((subject) => subject.slug === slug);

/** 表单初始值：把每个选项的 default 摊平成 { key: value } */
export const defaultOptions = (subject: TSubject) =>
  Object.fromEntries(
    subject.options.map((option) => [option.key, option.default]),
  ) as Record<string, string | string[]>;
