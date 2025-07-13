import { PropsWithChildren } from "react";
import { Menu } from "./components/menus/Menu";

export default function RootLayout({children}:PropsWithChildren){
  return <html lang="en">
    <body className="w-hull relative">
      <div className="w-full h-full flex bg-white "> 
        <div className="menu">
          <Menu/>
        </div>
        <div className="banner-wrapper p-4">
          {children}
        </div> 
      </div>
      
    </body>
  </html>
}