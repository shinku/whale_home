'use client'

import { createContext, PropsWithChildren, useEffect, useMemo, useState } from "react"



interface IUserContext {
  openId:string
}
export const UserContext = createContext<IUserContext>({
  openId: ''
})
export const Common = ({children}: PropsWithChildren)=>{
  const [userInfo, setUserInfo] = useState<IUserContext>({openId:""})
  const contextValue:IUserContext = useMemo(()=>{
    return {
      openId: userInfo.openId
    }
  },[userInfo])
  useEffect(()=>{
    const onMessage = (e:{data:{type:string,data:{openId:string}}})=>{
      if (e.data.type === 'userInfo') {
          // 处理用户信息
          setUserInfo({
            openId: e.data.data.openId
          })
        }
    }
    (window as unknown as  {
      wx: {
        miniProgram: {
          postMessage: (option: {data:string})=>void
        }
      }
    }).wx.miniProgram.postMessage({ data: 'webview_loaded' });
    window.addEventListener('message',onMessage)
    return ()=>{
      window.removeEventListener('message',onMessage)
    }
  },[])
  return <div>
    <UserContext.Provider value={contextValue}></UserContext.Provider>
    {children}
  </div>
}