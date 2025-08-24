import type { Metadata } from 'next';
import Script from 'next/script';
import AiMathTeacher from "./subpage/client/AiMathTeacher";
import AIWriter from "./subpage/client/AIWriter";
import { Common } from './subpage/client/components/Common';
import InputPage from './subpage/client/InputPage';

type PageProps = {
  params: Promise<{id:string[]}>
}

export async function generateMetadata({ params }: PageProps ): Promise<Metadata> {
  const actId = (await params).id[0]
  return {
    title: actId === 'math' ? '智能口算练习' : 'AI写作'
  }
}

const actMap:{[key:string]: React.FC} = {
  "aiwriter":()=><AIWriter/>,
  "math":()=><AiMathTeacher/>,
  'inputer':()=><InputPage/> // 默认页面
}

export default async function Page({ params }: PageProps) {
  const {id} = await params
  const actId = id[0]
  const Comp = actMap[actId] as React.FC
   return (
    <>
      <Script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js" strategy="beforeInteractive" />
      <div style={{
        maxWidth: "768px",
        margin: "0 auto"
      }}>
      {
        Comp && <Common>
          <Comp/>
        </Common>
      }
      </div>
    </>
  )
}
