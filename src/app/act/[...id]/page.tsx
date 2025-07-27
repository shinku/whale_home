import { AiMathTeacher } from "./subpage/client/AiMathTeacher";
import AIWriter from "./subpage/client/AIWriter";

type PageProps = {
  params: Promise<{id:string}>
}

const actMap:{[key:string]: React.FC} = {
  "aiwriter":()=><AIWriter/>,
  "math":()=><AiMathTeacher/>
}

export default async function Page({ params }: PageProps) {
  const {id} = await params
  const actId = id[0]
  const Comp = actMap[actId] as React.FC
   return (
    <div style={{
      maxWidth: "768px",
      margin: "0 auto"
    }}>
      {
        Comp && <Comp/>
      }
     
    </div>
  )
}
