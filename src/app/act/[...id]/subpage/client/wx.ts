// Add global wx type declaration
declare global {
  interface Window {
    wx?: {
      miniProgram: {
        navigateTo: (options: { url: string }) => void;
      };
    };
  }
}
export const jumpBakToMini = (list:{name:string,link:string}[]) => {
    window.wx?.miniProgram.navigateTo({
        url:"/pages/converResult/covert-result-page?list="+JSON.stringify(list)
    });
   };