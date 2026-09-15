"use client";

import { ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Progress,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../../utils/adminRequest";

interface LisenceGrant {
  id: number;
  service_list: string[];
  total_count: number;
  remain_count: number;
  use_count: number;
  start_time: string;
  create_time: string;
  end_time: string;
}

interface LisencePackage {
  total_count: number;
  remain_count: number;
  use_count: number;
  end_time: string;
  list: LisenceGrant[];
}

interface LisenceData {
  balance: number;
  available_balance: number;
  packages: Record<string, LisencePackage>;
}

interface LisenceResponse {
  status: number;
  code: number;
  data: LisenceData;
}

const packageLabels: Record<string, string> = {
  doc_restore: "文档还原",
  handwritten_erase: "手写擦除",
};

const usagePercent = (totalCount: number, useCount: number) => {
  if (!totalCount) {
    return 0;
  }
  return Math.min(100, Math.round((useCount / totalCount) * 100));
};

const grantColumns: TableColumnsType<LisenceGrant> = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 100,
  },
  {
    title: "服务",
    dataIndex: "service_list",
    key: "service_list",
    render: (services: string[]) => (
      <Space size={4} wrap>
        {services?.map((service) => <Tag key={service}>{service}</Tag>)}
      </Space>
    ),
  },
  {
    title: "总量 total_count",
    dataIndex: "total_count",
    key: "total_count",
    width: 140,
  },
  {
    title: "剩余 remain_count",
    dataIndex: "remain_count",
    key: "remain_count",
    width: 140,
    render: (remainCount: number) => (
      <Typography.Text strong>{remainCount}</Typography.Text>
    ),
  },
  {
    title: "已用 use_count",
    dataIndex: "use_count",
    key: "use_count",
    width: 140,
    render: (useCount: number) => <Tag color="blue">{useCount}</Tag>,
  },
  {
    title: "开始时间 start_time",
    dataIndex: "start_time",
    key: "start_time",
    width: 180,
  },
  {
    title: "结束时间 end_time",
    dataIndex: "end_time",
    key: "end_time",
    width: 180,
    render: (endTime: string) => <Tag color="geekblue">{endTime}</Tag>,
  },
  {
    title: "创建时间 create_time",
    dataIndex: "create_time",
    key: "create_time",
    width: 180,
  },
];

export default function LisencePage() {
  const [data, setData] = useState<LisenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLisence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: LisenceResponse = await adminRequest("/api/lisence/hehe");
      if (res.status === 200) {
        setData(res.data);
      } else {
        setError(`接口返回异常状态：${res.status}`);
      }
    } catch (err) {
      console.error("获取授权数据失败", err);
      setError("获取授权数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLisence();
  }, [fetchLisence]);

  return (
    <div className=" mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Typography.Title level={3} style={{ margin: 0 }}>
          HEHE&apos;S LISENCE
        </Typography.Title>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={fetchLisence}
        >
          刷新
        </Button>
      </div>

      {error && (
        <Alert type="error" showIcon message={error} className="mb-4" />
      )}

      <Spin spinning={loading}>
        {data ? (
          <LisenceView data={data} />
        ) : (
          !loading && !error && <Empty description="暂无数据" />
        )}
      </Spin>
    </div>
  );
}

export const LisenceView = ({ data }: { data: LisenceData }) => {
  const packages = Object.entries(data.packages || {});

  return (
    <>
      <Card className="mb-4">
        <Space size={64} wrap>
          <Statistic title="余额 balance" value={data.balance} />
          <Statistic
            title="可用余额 available_balance"
            value={data.available_balance}
          />
        </Space>
      </Card>

      {packages.length === 0 ? (
        <Empty description="暂无套餐数据" />
      ) : (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {packages.map(([key, pkg]) => (
            <Card
              key={key}
              title={`${packageLabels[key] || key}（${key}）`}
              extra={<Tag color="blue">end_time {pkg.end_time}</Tag>}
            >
              <Descriptions
                bordered
                size="small"
                column={{ xs: 1, sm: 2, md: 4 }}
              >
                <Descriptions.Item label="总量 total_count">
                  {pkg.total_count}
                </Descriptions.Item>
                <Descriptions.Item label="剩余 remain_count">
                  {pkg.remain_count}
                </Descriptions.Item>
                <Descriptions.Item label="已用 use_count">
                  {pkg.use_count}
                </Descriptions.Item>
                <Descriptions.Item label="到期时间 end_time">
                  {pkg.end_time}
                </Descriptions.Item>
              </Descriptions>

              <Progress
                className="mt-4"
                percent={usagePercent(pkg.total_count, pkg.use_count)}
                format={(percent) => `已用 ${percent}%`}
              />

              <Table<LisenceGrant>
                className="mt-4"
                size="small"
                rowKey="id"
                columns={grantColumns}
                dataSource={pkg.list || []}
                pagination={false}
                scroll={{ x: "max-content" }}
                locale={{ emptyText: "暂无授权记录" }}
              />
            </Card>
          ))}
        </Space>
      )}
    </>
  );
};
