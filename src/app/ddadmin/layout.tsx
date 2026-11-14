import { randomUUID } from "node:crypto";
import type { PropsWithChildren } from "react";

import {
  checkAdminPermission,
  createAdminLoginCode,
  getAdminSession,
  type TAdminLoginCode,
} from "@/lib/admin-login";

import { AdminLoginPanel } from "./components/AdminLoginPanel";
import { AdminLoginProvider } from "./components/AdminLoginProvider";
import { AdminShell } from "./components/AdminShell";
import { AdminTheme } from "./components/AdminTheme";
import { AdminUserProvider } from "./components/AdminUserProvider";

const AccessDenied = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
      <h1 className="text-base font-semibold text-gray-900">无后台访问权限</h1>
      <p className="mt-2 text-xs text-gray-500">
        当前账号已登录，但没有运营后台管理员权限。
      </p>
    </div>
  </div>
);

const LoginUnavailable = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
      <h1 className="text-base font-semibold text-gray-900">
        登录服务暂不可用
      </h1>
      <p className="mt-2 text-xs text-gray-500">
        暂时无法生成登录二维码，请稍后刷新页面重试。
      </p>
    </div>
  </div>
);

export default async function RootLayout({ children }: PropsWithChildren) {
  const session = await getAdminSession();

  if (session) {
    let authorized = false;
    try {
      authorized = await checkAdminPermission(session.openid);
    } catch (error) {
      console.error("Error checking ddadmin access:", error);
    }

    return (
      <AdminTheme>
        {authorized ? (
          <AdminUserProvider
            user={{
              openid: session.openid,
              expiresTime: session.expires_time,
            }}
          >
            <AdminShell>{children}</AdminShell>
          </AdminUserProvider>
        ) : (
          <AccessDenied />
        )}
      </AdminTheme>
    );
  }

  let initialLogin: TAdminLoginCode | null = null;
  try {
    const scene = randomUUID().replace(/-/g, "");
    initialLogin = await createAdminLoginCode(scene);
  } catch (error) {
    console.error("Error creating admin login code:", error);
  }

  return (
    <AdminTheme>
      {initialLogin ? (
        <AdminLoginProvider initialLogin={initialLogin}>
          <AdminLoginPanel />
        </AdminLoginProvider>
      ) : (
        <LoginUnavailable />
      )}
    </AdminTheme>
  );
}
