"use client";

import { createContext, useContext, type PropsWithChildren } from "react";

export type TAdminUser = {
  openid: string;
  expiresTime: string;
};

const AdminUserContext = createContext<TAdminUser | null>(null);

export const AdminUserProvider = ({
  user,
  children,
}: PropsWithChildren<{ user: TAdminUser }>) => (
  <AdminUserContext.Provider value={user}>{children}</AdminUserContext.Provider>
);

export const useAdminUser = () => {
  const user = useContext(AdminUserContext);
  if (!user) {
    throw new Error("useAdminUser 必须在 AdminUserProvider 内使用");
  }
  return user;
};
