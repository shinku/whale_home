"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { useRouter } from "next/navigation";

export type TAdminLoginCode = {
  scene: string;
  image: string;
  expires_time: string;
};

type TPollState = "idle" | "pending" | "ready" | "expired" | "error";

type TAdminLoginContext = {
  isLogin: boolean;
  openid: string | null;
  loginCode: TAdminLoginCode | null;
  pollState: TPollState;
};

const AdminLoginContext = createContext<TAdminLoginContext | null>(null);

export const AdminLoginProvider = ({
  initialLogin,
  children,
}: PropsWithChildren<{
  initialLogin: TAdminLoginCode | null;
}>) => {
  const router = useRouter();
  const [openid, setOpenid] = useState<string | null>(null);
  const [pollState, setPollState] = useState<TPollState>(
    initialLogin ? "pending" : "idle",
  );
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!initialLogin) return;

    stoppedRef.current = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (!stoppedRef.current) {
        timer = setTimeout(poll, 3000);
      }
    };

    const poll = async () => {
      if (stoppedRef.current) return;

      try {
        const response = await fetch(
          `/api/admin/login/status?scene=${encodeURIComponent(initialLogin.scene)}`,
          { cache: "no-store" },
        );
        const result = (await response.json().catch(() => null)) as {
          state?: string;
          openid?: string;
        } | null;

        if (!response.ok) {
          setPollState("error");
          schedule();
          return;
        }
        if (result?.state === "ready" && result.openid) {
          setOpenid(result.openid);
          setPollState("ready");
          stoppedRef.current = true;
          router.refresh();
          return;
        }
        if (result?.state === "expired" || result?.state === "not_found") {
          setPollState("expired");
          stoppedRef.current = true;
          return;
        }
        setPollState("pending");
        schedule();
      } catch {
        setPollState("error");
        schedule();
      }
    };

    void poll();
    return () => {
      stoppedRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [initialLogin, router]);

  return (
    <AdminLoginContext.Provider
      value={{
        isLogin: Boolean(openid),
        openid,
        loginCode: initialLogin,
        pollState,
      }}
    >
      {children}
    </AdminLoginContext.Provider>
  );
};

export const useAdminLogin = () => {
  const context = useContext(AdminLoginContext);
  if (!context) {
    throw new Error("useAdminLogin 必须在 AdminLoginProvider 内使用");
  }
  return context;
};
