"use client";

import type { PropsWithChildren } from "react";

import { ConfigProvider } from "antd";

export const AdminTheme = ({ children }: PropsWithChildren) => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#6ED8E6",
        borderRadius: 8,
        fontSize: 12,
        fontSizeSM: 10,
        fontSizeLG: 14,
        fontSizeHeading1: 18,
        fontSizeHeading2: 16,
        fontSizeHeading3: 14,
        fontSizeHeading4: 13,
        fontSizeHeading5: 12,
        fontWeightStrong: 600,
      },
    }}
  >
    <div className="text-[12px] font-normal">{children}</div>
  </ConfigProvider>
);
