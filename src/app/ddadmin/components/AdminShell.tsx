"use client";

import { ConfigProvider, Layout, Typography } from "antd";
import { PropsWithChildren } from "react";
import { Menu } from "./menus/Menu";

const { Sider, Content } = Layout;

export const AdminShell = ({ children }: PropsWithChildren) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#6ED8E6",
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sider theme="light" width={240} breakpoint="lg" collapsedWidth={64}>
          <div style={{ padding: "16px 12px", textAlign: "center" }}>
            <Typography.Text strong>鲸鱼管理后台</Typography.Text>
          </div>
          <Menu />
        </Sider>
        <Content style={{ padding: 12, background: "#f5f5f5" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: 8,
              padding: 12,
              minHeight: "100%",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};
