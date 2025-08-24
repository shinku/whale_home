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
    const openId = params.get('userId') ||  params.get('openid') ||''
    
    if(!openId) {
      setUsedComp(<div>缺少用户信息，请从正确的入口进入</div>)
      alert('缺少openid参数');
      return;
    }
    setUserInfo({openId})
  },[])
  useEffect(()=>{
    if(!userInfo.openId) return;
    console.log("userInfo", userInfo)
    // /api/aiact/aiwriter
    fetch("/api/user/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userInfo.openId
      },
    }).then(res=>res.json()).then(data=>{
      if(!data.openid) {
        alert('用户信息获取失败，请检查链接是否正确');
        setUsedComp(<div>用户信息获取失败，请检查链接是否正确</div>)  
      } 
    })
  },[userInfo])
  const [usedComp, setUsedComp] = useState(children)
  return <div>
    <UserContext.Provider value={contextValue}>
      <div>{usedComp}</div> 
    </UserContext.Provider>
  </div>
}