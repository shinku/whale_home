"use client";

import { Table, Typography, type TableColumnsType } from "antd";
import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../../utils/adminRequest";

interface User {
  openid: string;
  user_name: string;
  createdAt: string;
}

interface UserListResponse {
  status: number;
  data: {
    count: number;
    rows: User[];
  };
}

const pageSize = 10;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const columns: TableColumnsType<User> = [
  {
    title: "OpenID",
    dataIndex: "openid",
    key: "openid",
    width: 280,
    render: (openid: string) => (
      <Typography.Text code copyable>
        {openid}
      </Typography.Text>
    ),
  },
  {
    title: "用户名",
    dataIndex: "user_name",
    key: "user_name",
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 220,
    render: (createdAt: string) => formatDate(createdAt),
  },
];

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const offset = currentPage * pageSize;
      const res: UserListResponse = await adminRequest(
        `/api/admin/summary/users?offset=${offset}&page=${pageSize}`,
      );

      if (res.status === 200) {
        setUsers(res.data.rows);
        setTotalCount(res.data.count);
      }
    } catch (error) {
      console.error("获取用户列表失败", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div>
      <Table<User>
        rowKey="openid"
        columns={columns}
        dataSource={users}
        loading={loading}
        locale={{ emptyText: "暂无用户数据" }}
        scroll={{ x: "max-content" }}
        pagination={{
          current: currentPage + 1,
          pageSize,
          total: totalCount,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条 / 共 ${total} 个用户`,
          onChange: (page) => setCurrentPage(page - 1),
        }}
      />
    </div>
  );
}
