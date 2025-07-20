
import BannerPage from "./components/wrap";
export async function generateStaticParams() {
  return [{ slug: 'default' }]; // 预生成参数
}
export default function Page(){
  return <div >
    <BannerPage/>
  </div>
}
