import type { Metadata } from "next";
import Script from "next/script";
import AiMathTeacher from "./subpage/client/AiMathTeacher";
import AIWriter from "./subpage/client/AIWriter";
import { Common } from "./subpage/client/components/Common";
import InputPage from "./subpage/client/InputPage";

type PageProps = {
  params: Promise<{ id: string[] }>;
};

type TActType = "aiwriter" | "math" | "inputer";

const actMapTitle: Record<TActType, string> = {
  aiwriter: "AI写作",
  inputer: "上传",
  math: "智能口算练习",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const actId = (await params).id[0] as TActType;
  return {
    title: actMapTitle[actId],
  };
}

const actMap: Record<TActType, React.FC> = {
  aiwriter: () => <AIWriter />,
  math: () => <AiMathTeacher />,
  inputer: () => <InputPage />, // 默认页面
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const actId = id[0] as TActType;
  const Comp = actMap[actId] as React.FC;
  return (
    <>
      <Script
        src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"
        strategy="beforeInteractive"
      />
      <div
        style={{
          maxWidth: "768px",
          margin: "0 auto",
        }}
      >
        {Comp && (
          <Common>
            <Comp />
          </Common>
        )}
      </div>
    </>
  );
}
