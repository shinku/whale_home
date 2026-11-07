"use client";

import { usePathname } from "next/navigation";

import { Icp } from "@/components/Icp";

const ICP_HIDDEN_PREFIXES = ["/subjects", "/agent", "/act"] as const;

export const shouldShowIcp = (pathname: string | null) => {
  if (!pathname) return true;
  return !ICP_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

/** AI 学科和智能工具页面不展示 ICP 备案信息。 */
export const RouteAwareIcp = () => {
  const pathname = usePathname();
  return shouldShowIcp(pathname) ? <Icp /> : null;
};
