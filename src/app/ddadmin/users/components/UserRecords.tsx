"use client";

import {
  Button,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../../utils/adminRequest";

interface UserRecord {
  record_count: number;
  openid: string;
  u_name: string;
  last_used: string;
  first_used: string;
}

interface UserRecordsResponse {
  status: number;
  data: UserRecord[];
}

type UserRecordRow = UserRecord & { key: string };

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

const columns: TableColumnsType<UserRecordRow> = [
  {
    title: "OpenID",
    dataIndex: "openid",
    key: "openid",
    width: 260,
    render: (openid: string) => (
      <Typography.Text code copyable>
        {openid}
      </Typography.Text>
    ),
  },
  {
    title: "用户名",
    dataIndex: "u_name",
    key: "u_name",
  },
  {
    title: "使用记录数量",
    dataIndex: "record_count",
    key: "record_count",
    width: 140,
    render: (recordCount: number) => <Tag color="blue">{recordCount}</Tag>,
  },
  {
    title: "第一次使用时间",
    dataIndex: "first_used",
    key: "first_used",
    width: 220,
    render: (firstUsed: string) => formatDate(firstUsed),
  },
  {
    title: "最后一次使用时间",
    dataIndex: "last_used",
    key: "last_used",
    width: 220,
    render: (lastUsed: string) => formatDate(lastUsed),
  },
];

export default function UserRecords() {
  const [records, setRecords] = useState<UserRecordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const offset = currentPage * pageSize;
      const res: UserRecordsResponse = await adminRequest(
        `/api/admin/summary/users_record?offset=${offset}&page=${pageSize}`,
      );

      if (res.status === 200) {
        setRecords(
          res.data.map((record, index) => ({
            ...record,
            key: `${record.openid}-${index}`,
          })),
        );
      }
    } catch (error) {
      console.error("获取用户使用记录失败", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 后端未返回总数，最后一页数据不足时认为没有下一页
  const hasNextPage = records.length >= pageSize;

  return (
    <div>
      <Table<UserRecordRow>
        rowKey="key"
        columns={columns}
        dataSource={records}
        loading={loading}
        locale={{ emptyText: "暂无用户使用记录" }}
        scroll={{ x: "max-content" }}
        pagination={false}
      />

      <div className="mt-4 flex justify-center items-center">
        <Space size="middle">
          <Button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
          >
            上一页
          </Button>
          <Typography.Text type="secondary">
            第 {currentPage + 1} 页
          </Typography.Text>
          <Button
            disabled={!hasNextPage}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            下一页
          </Button>
        </Space>
      </div>
    </div>
  );
}
