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
    const params = new URLSearchParams(window.location.search)
    const openId = params.get('openid') || ''
    setUserInfo({openId})
  },[])
  return <div>
    <UserContext.Provider value={contextValue}></UserContext.Provider>
    {children}
  </div>
}