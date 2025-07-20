export const getApiHost = ()=>{
  const localhostHost = "http://localhost:7001/";
  const productionHost = "https://api.whalepea.com/";
  return {"development": localhostHost,"test":localhostHost, "production": productionHost}[process.env.NODE_ENV] || localhostHost;
}
