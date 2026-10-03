import type { TSubjectResult } from "../result";
import type { TSubject } from "../subjects";
import { QrCode } from "./QrCode";
import {
  ArithmeticPaper,
  CopybookPaper,
  FormulaPaper,
  IdiomPaper,
  TranslatePaper,
  VerticalPaper,
  WordsPaper,
} from "./subject_paper";

/**
 * 结果页卷面外壳：A4 纸效果，左上角二维码 + 品牌，右上角标题与手写信息栏。
 * 正文按学科分发给 components/subject_paper 下各自的卷面组件。
 */
export const SubjectPaper = ({
  subject,
  result,
}: {
  subject: TSubject;
  result: TSubjectResult;
}) => {
  const body = <PaperBody subject={subject} result={result} />;

  // 不需要卷头的学科（例如成语填空的即时填字）只渲染正文
  if (subject.showPaperHeader === false) {
    return body;
  }

  return (
    <div className="mx-auto w-full max-w-[794px] bg-white px-7 py-6 text-gray-900 shadow-sm print:max-w-none print:px-0 print:shadow-none">
      <div className="flex items-start gap-3 border-b border-gray-300 pb-3">
        <div className="flex items-center gap-2">
          <QrCode />
          <span className="text-[13px] font-semibold text-gray-700">
            鲸鱼擦除君
          </span>
        </div>
        <div className="min-w-0 flex-1 pl-2">
          <div className="text-center text-[19px] font-bold">
            {result.title || subject.resultTitle}
          </div>
          {result.subtitle ? (
            <div className="mt-1 text-center text-[12px] text-gray-500">
              {result.subtitle}
            </div>
          ) : null}
          <div className="mt-2 flex justify-between text-[10px] text-gray-500">
            <span>＿＿月＿＿日</span>
            <span>姓名：＿＿＿＿＿＿</span>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-500">
            <span>＿＿分＿＿秒</span>
            <span>班级：＿＿＿＿＿＿</span>
          </div>
        </div>
      </div>
      <div className="pt-4">{body}</div>
    </div>
  );
};

const PaperBody = ({
  subject,
  result,
}: {
  subject: TSubject;
  result: TSubjectResult;
}) => {
  if (result.items.length === 0) {
    return <p className="text-[13px] text-gray-400">暂时没有内容</p>;
  }

  switch (subject.slug) {
    case "arithmetic":
      return <ArithmeticPaper items={result.items} />;
    case "vertical":
      return <VerticalPaper items={result.items} />;
    case "copybook":
      return (
        <CopybookPaper items={result.items} title={result.title || "字帖本"} />
      );
    case "idiom":
      return <IdiomPaper items={result.items} />;
    case "translate":
      return <TranslatePaper items={result.items} />;
    case "formula":
      return <FormulaPaper items={result.items} mode={result.mode} />;
    case "words":
      return <WordsPaper items={result.items} type={result.type} />;
    default:
      return null;
  }
};
