"use client";

export const getDev = () => window.location.hostname === "localhost";

export const doRequest = async (
  url: string,
  options: RequestInit = {},
  openid = "",
) => {
  if (!openid) {
    throw new Error("Missing admin openid");
  }

  const headers = new Headers(options.headers);
  headers.set("x-user-id", openid);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
