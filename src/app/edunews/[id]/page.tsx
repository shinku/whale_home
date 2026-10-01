import type { Metadata } from "next";
import { WxScript } from "@/components/WxScript";
import { ENTRY_FROM_QUERY_KEY } from "@/utils/eduNews";
import { NewsDetail } from "../components/NewsDetail";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `教育新闻 #${id}` };
}

export default async function EduNewsDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const raw = query[ENTRY_FROM_QUERY_KEY];
  const entryFrom = Array.isArray(raw) ? raw[0] : raw;

  return (
    <>
      {/* 详情页需要 wx.miniProgram 返回小程序，按需引入 jweixin */}
      <WxScript />
      <NewsDetail id={id} entryFrom={entryFrom} />
    </>
  );
}
