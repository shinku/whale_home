import { cookies } from "next/headers";

import { getApiHost } from "@/utils";

import { getAdminSessionCookieName } from "./admin-login-config";

export {
  adminCookieIsSecure,
  getAdminSessionCookieName,
} from "./admin-login-config";

type TBackendResponse<T> = {
  status?: number;
  data?: T;
  message?: string;
};

export type TAdminLoginState = "pending" | "ready" | "expired" | "not_found";

export type TAdminLoginStatus = {
  state: TAdminLoginState;
  scene: string;
  token?: string;
  openid?: string;
  expires_time?: string;
};

export type TAdminSession = {
  openid: string;
  expires_time: string;
};

export type TAdminLoginCode = {
  scene: string;
  page: string;
  image: string;
  expires_time: string;
};

const backendRequest = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${getApiHost()}${path.replace(/^\/+/, "")}`, {
    ...init,
    cache: "no-store",
    headers,
  });
  const body = (await response
    .json()
    .catch(() => null)) as TBackendResponse<T> | null;

  if (!response.ok || body?.status !== 200 || body.data == null) {
    throw new Error(body?.message || "后端请求失败");
  }
  return body.data;
};

export const createAdminLoginCode = (scene: string) =>
  backendRequest<TAdminLoginCode>("api/admin/getwxacodeunlimit", {
    method: "POST",
    body: JSON.stringify({
      scene,
      page: "pages/welcome/welcome",
    }),
  });

export const pollAdminLoginScene = (scene: string) =>
  backendRequest<TAdminLoginStatus>(
    `api/admin/login/status?scene=${encodeURIComponent(scene)}`,
  );

export const exchangeAdminToken = (token: string) =>
  backendRequest<TAdminSession>("api/admin/openid", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

export const checkAdminPermission = async (openid: string) => {
  const params = new URLSearchParams({
    user_id: openid,
    admin_type: "operator",
  });
  const result = await backendRequest<{
    authorized?: boolean;
  }>(`admin/user_lisence?${params.toString()}`, {
    headers: { "x-user-id": openid },
  });
  return result.authorized === true;
};

export const getAdminSession = async (): Promise<TAdminSession | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;
  if (!token) return null;

  try {
    return await exchangeAdminToken(token);
  } catch {
    return null;
  }
};
