"use client";

import { Card, Typography } from "antd";

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        后台管理页面
      </Typography.Title>
      <Card>请从左侧菜单选择需要管理的模块。</Card>
    </div>
  );
}
