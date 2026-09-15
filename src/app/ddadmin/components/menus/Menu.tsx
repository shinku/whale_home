"use client";

import {
  PictureOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Menu as AntdMenu, type MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const menusOptions: {
  name: string;
  path: string;
  icon: React.ReactNode;
}[] = [
  {
    name: "BANNER MANAGEMENT",
    path: "/ddadmin/banner",
    icon: <PictureOutlined />,
  },
  {
    name: "USERS MANAGEMENT",
    path: "/ddadmin/users",
    icon: <TeamOutlined />,
  },
  {
    name: "HEHE'S LISENCE",
    path: "/ddadmin/lisence",
    icon: <SafetyCertificateOutlined />,
  },
];

const items: MenuProps["items"] = menusOptions.map((menu) => ({
  key: menu.path,
  icon: menu.icon,
  label: <Link href={menu.path}>{menu.name}</Link>,
}));

export const Menu = () => {
  const pathname = usePathname();

  const selectedKeys = useMemo(() => {
    const current = menusOptions.find(
      (menu) => pathname === menu.path || pathname.startsWith(`${menu.path}/`),
    );
    return current ? [current.path] : [];
  }, [pathname]);

  return (
    <AntdMenu
      mode="inline"
      items={items}
      selectedKeys={selectedKeys}
      style={{ borderInlineEnd: "none" }}
    />
  );
};
