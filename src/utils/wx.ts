// 微信 JSSDK（jweixin）在 webview 中注入的 wx 对象。
// 需要在页面里引入 https://res.wx.qq.com/open/js/jweixin-1.6.0.js 后才有值，
// 组件可复用 @/components/WxScript 来引入该脚本。
export interface WxMiniProgramApi {
  navigateTo: (options: { url: string }) => void;
  navigateBack: (options?: { delta?: number }) => void;
  redirectTo: (options: { url: string }) => void;
  switchTab: (options: { url: string }) => void;
  reLaunch: (options: { url: string }) => void;
  postMessage: (options: { data?: unknown }) => void;
}

declare global {
  interface Window {
    wx?: {
      miniProgram: WxMiniProgramApi;
    };
  }
}

/** 当前是否运行在小程序 webview 中（wx.miniProgram 可用） */
export const isMiniProgram = () =>
  typeof window !== "undefined" && Boolean(window.wx?.miniProgram);

/** 跳转到小程序页面 */
export const miniProgramNavigateTo = (url: string) => {
  window.wx?.miniProgram?.navigateTo({ url });
};

/**
 * 把生成好的文件交给小程序处理（下载 / 预览）：
 * 跳到小程序的结果页，`list` 每项是 `{ name, link }`。
 * 只有在小程序 webview 里（`wx.miniProgram` 可用）才有效。
 */
export const jumpBakToMini = (list: { name: string; link: string }[]) => {
  miniProgramNavigateTo(
    "/pages/converResult/covert-result-page?list=" + JSON.stringify(list),
  );
};

/** 返回小程序上一页 */
export const miniProgramNavigateBack = (delta = 1) => {
  window.wx?.miniProgram?.navigateBack({ delta });
};
