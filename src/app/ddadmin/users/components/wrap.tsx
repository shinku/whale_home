"use client";

import { Tabs, Typography } from "antd";
import { useState } from "react";
import UserList from "./UserList";
import UserRecords from "./UserRecords";

type TabKey = "users" | "records";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  return (
    <div className="p-6 mx-auto">
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        用户管理
      </Typography.Title>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={[
          {
            key: "users",
            label: "用户列表",
            children: <UserList />,
          },
          {
            key: "records",
            label: "用户使用记录",
            children: <UserRecords />,
          },
        ]}
      />
    </div>
  );
}
