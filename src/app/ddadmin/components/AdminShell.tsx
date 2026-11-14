"use client";

import { Layout, Typography } from "antd";
import { PropsWithChildren } from "react";
import { Menu } from "./menus/Menu";

const { Sider, Content } = Layout;

export const AdminShell = ({ children }: PropsWithChildren) => {
  return (
    <Layout className="h-dvh overflow-hidden">
      <Sider theme="light" width={240} breakpoint="lg" collapsedWidth={64}>
        <div style={{ padding: "16px 12px", textAlign: "center" }}>
          <Typography.Text strong>鲸鱼管理后台</Typography.Text>
        </div>
        <Menu />
      </Sider>
      <Content
        className="flex min-h-0 flex-col overflow-hidden"
        style={{ padding: 12, background: "#f5f5f5" }}
      >
        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{
            background: "#ffffff",
            borderRadius: 8,
            padding: 12,
          }}
        >
          {children}
        </div>
      </Content>
    </Layout>
  );
};
