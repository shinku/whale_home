
import { MainLogo } from "@/components/MainLogo"
import { MainWrap } from "@/components/mainWrap"
import { Metadata, Viewport } from "next"

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}
export const metadata:Metadata = {
  title:"欢迎访问鲸豆"
}
export default function Page () {
  return (<MainWrap>
      <MainLogo/>
  </MainWrap>)
}