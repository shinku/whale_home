export const getApiHost = (env?: "development" | "test" | "production") => {
  const productionHost = "https://api.whalepea.com/";
  const localhostHost = "http://127.0.0.1:7001/";
  // const localhostHost = productionHost
  return ({"development": localhostHost,"test":localhostHost, "production": productionHost}[env || process.env.NODE_ENV]) || localhostHost;
}
