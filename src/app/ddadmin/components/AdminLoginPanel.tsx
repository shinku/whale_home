"use client";

import { useRouter } from "next/navigation";

import { useAdminLogin } from "./AdminLoginProvider";

export const AdminLoginPanel = () => {
  const router = useRouter();
  const { isLogin, openid, loginCode, pollState } = useAdminLogin();

  if (isLogin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
          <h1 className="text-base font-semibold text-gray-900">登录成功</h1>
          <p className="mt-2 text-xs text-gray-500">正在进入运营后台...</p>
          <p className="mt-1 text-xs text-gray-400">{openid}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-base font-semibold text-gray-900">
          管理员扫码登录
        </h1>
        <p className="mt-2 text-xs leading-5 text-gray-500">
          请使用微信扫描二维码，并在小程序中点击“确认登录”。
        </p>

        {loginCode ? (
          <div className="mt-5 flex justify-center">
            {/* 小程序码由后端生成，可能为 data URL 或远程地址。 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={loginCode.image}
              alt="管理员登录小程序码"
              className="h-60 w-60 rounded-xl border border-gray-100 object-contain"
            />
          </div>
        ) : null}

        <div className="mt-4 min-h-6 text-xs">
          {pollState === "pending" ? (
            <p className="text-gray-500">等待扫码确认...</p>
          ) : null}
          {pollState === "error" ? (
            <p className="text-amber-600">网络异常，正在重试...</p>
          ) : null}
          {pollState === "expired" ? (
            <p className="text-red-500">二维码已过期，请重新获取。</p>
          ) : null}
        </div>

        {pollState === "expired" ? (
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-3 h-9 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white"
          >
            刷新二维码
          </button>
        ) : null}
      </section>
    </main>
  );
};
