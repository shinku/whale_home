import { SubjectDetailPage } from "../../components/SubjectDetailPage";

/** 数学公式详情：按 requestid 读取这次生成的结果 */
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SubjectDetailPage slug="formula" searchParams={searchParams} />;
}
