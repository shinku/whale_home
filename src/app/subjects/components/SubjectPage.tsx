import { getSubject, type TSubjectSlug } from "../subjects";
import { SubjectRunner } from "./SubjectRunner";

/** 子学科页面：按 slug 取配置，渲染公共的「选项 → 生成 → 结果」流程 */
export const SubjectPage = ({ slug }: { slug: TSubjectSlug }) => {
  const subject = getSubject(slug);

  if (!subject) {
    return <p className="p-6 text-sm text-gray-500">该学科暂未配置</p>;
  }

  return <SubjectRunner subject={subject} />;
};
