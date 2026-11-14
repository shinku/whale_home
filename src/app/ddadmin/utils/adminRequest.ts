export const adminRequest = async (
  url: string,
  options: RequestInit = {},
  openid = "",
) => {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (openid) headers.set("x-user-id", openid);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
