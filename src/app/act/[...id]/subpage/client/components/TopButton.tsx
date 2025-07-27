'use client'

import Image from "next/image"

export const TopButton = ({onClick}:{onClick: ()=>void})=>{
  return <div style={{
    position: 'fixed',
    zIndex: 99,
    bottom:"20%",
    right:"5px",
    cursor:"pointer"
  }}
    onClick={onClick}><Image src="/images/top-button.svg" alt="topbtn" width="20" height="20"/></div>
}