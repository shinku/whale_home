import { PropsWithChildren } from "react"

export const Mbutton = ({onClick, children,type = 'normal',className = ""}:{onClick:()=>void} & PropsWithChildren & {type?: "normal" | "text", className?:string})=>{
  return <div 
        onClick={onClick}
        className={`cursor-pointer mb-4 p-2 ${type === "normal"?"bg-blue-500":"bg-transparent"} text-white rounded ${className} flex justify-center items-center`}
      >
        {
          children
        }
  </div>
}