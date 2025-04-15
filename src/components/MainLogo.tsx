import Image from "next/image"
import { CSSProperties } from "react"
export const style:CSSProperties = {
  margin: "0 auto",
}
/**
 * MainLogo
 * @returns 
 */
export const MainLogo = ()=>{
  return <Image width={666} height={666} src="/images/whale.jpeg" alt="" style={style}></Image>
}