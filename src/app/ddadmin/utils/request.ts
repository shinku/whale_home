// get dev
'use clients'
export const getDev = () => {
 if(window.location.hostname === "localhost") {
   return true;
 }
 return false;
}

export const doRequest = async (url: string, options: RequestInit = {}) => {
  const params = new URL(window.location.href).searchParams;
  // 兼容 userId 和 openid 两种参数
  const userId = params.get('userId') || params.get('openid');
  console.log({userId})
  if(!userId ){
    throw new Error('Missing userId in URL parameters');
  }
  const response = await fetch(`${url}`, {
    ...options,
    headers: {
      ...options.headers,
      "x-user-id": userId,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}