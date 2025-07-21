import AIWriter from "./subpage/client/AIWriter";



type PageProps = {
  params: Promise<{id:string}>
}


export default async function Page({ params }: PageProps) {
  const {id} = await params
   return (
    <div style={{
      maxWidth: "768px",
      margin: "0 auto"
    }}>
      {
        id[0] === "1" &&  <AIWriter />
      }
     
    </div>
  )
}
