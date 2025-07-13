// get dev
export const getDev = () => {
 if(window.location.hostname === "localhost") {
   return true;
 }
 return false;
}

export const doRequest = async (url: string, options: RequestInit = {}) => {

  
  const response = await fetch(`${url}`, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}