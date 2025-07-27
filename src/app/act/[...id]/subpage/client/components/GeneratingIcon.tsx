'use client'
import { LoadingOutlined } from "@ant-design/icons"

export const GenerateIcon = ({generating}:{generating: boolean})=>{
  return <span>
    {
      generating && <LoadingOutlined/>
    }
  </span>
}