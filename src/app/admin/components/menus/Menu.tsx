'use client';

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

const menusOptions:{"name":string, id?:string,path:string}[] = [
  {
    name: "BANNER MANAGEMENT",
    path: "/admin/banner",
  },

]
export const Menu = ()=>{
  const router = useRouter();
  const pathname = usePathname();
  useEffect(()=>{
    console.log({pathname})
  },[pathname])
  const clickNav = useCallback((index:number)=>{
    const option = menusOptions[index];
    if(option && option.path){
      router.push(option.path);
    }
  },[router])
  return <div className="menu p-4 font-bold">
    <ul>
    {
      menusOptions.map((menu, index:number) => (
        <li key={menu.id || menu.name}>
          <a
            href={menu.path}
            onClick={()=>clickNav(index)}
            className={`text-underline hover:text-blue-500 ${pathname === menu.path ? 'text-blue-500' : ''}`}
          >
            {menu.name}
          </a>
        </li>
      ))
    }
    </ul>
  </div>;
}