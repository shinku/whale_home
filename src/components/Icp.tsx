import { CSSProperties } from "react";

/**
 * ICP备案号
 * @returns 
 */
export const Icp = () => {
  const style = {
    textAlign: "center",
    margin: "20px 0",
    fontSize: "12px",
    color: "#666",
    
  } as CSSProperties;
  const style2 = { color: "#666", textDecoration: "none" } as CSSProperties;
  return (
    <div id="footer-beian" style={style}>
      <a href="https://beian.miit.gov.cn/" target="_blank" style={style2}>沪ICP备2025121210号-1</a>
    </div>
  );
}