import Script from "next/script";

/**
 * 微信 JSSDK（jweixin）脚本。
 * 需要在页面里调用 wx.miniProgram.* 时引入本组件即可。
 */
export const WxScript = () => (
  <Script
    src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"
    strategy="beforeInteractive"
  />
);
