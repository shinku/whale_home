"use client";

import { EditOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { doRequest } from "../../utils/request";

interface Banner {
  id: string;
  banner_image: string;
  action: string;
  status: string;
  lane: string;
  content: string;
  name: string;
  type: "normal" | "icon";
}

interface BannerFormData {
  banner_image: string | File;
  action: string;
  status: string;
  lane: string;
  content: string;
  name: string;
  type: "normal" | "icon";
}

const createEmptyFormData = (): BannerFormData => ({
  banner_image: "",
  action: "link",
  status: "active",
  lane: "whale",
  content: "http://",
  name: "",
  type: "normal",
});

const typeOptions = [
  { label: "大banner", value: "normal" },
  { label: "icon点位", value: "icon" },
];

const actionOptions = [
  { label: "链接", value: "link" },
  { label: "小程序内页", value: "miniprogram" },
];

const statusOptions = [
  { label: "生效", value: "active" },
  { label: "失效", value: "deactive" },
];

const typeLabelMap: Record<string, string> = {
  normal: "大banner",
  icon: "icon点位",
};

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(createEmptyFormData);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await doRequest("/api/admin/banner?lane=whale");
      const data = res.data.list;
      setBanners(data);
    } catch (error) {
      console.error("获取banner列表失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.banner_image) {
      messageApi.warning("请上传图片");
      return;
    }
    if (!formData.name) {
      messageApi.warning("请填写运营名称");
      return;
    }
    if (!formData.content) {
      messageApi.warning("请填写banner内容");
      return;
    }

    setSubmitting(true);
    try {
      let bannerImageUrl = formData.banner_image;

      if (formData.banner_image instanceof File) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", formData.banner_image);
        const uploadRes = await doRequest("/api/admin/file_upload", {
          method: "POST",
          body: uploadFormData,
        });

        bannerImageUrl = uploadRes.data;
      }

      const payload = {
        ...formData,
        banner_image: bannerImageUrl,
        action: `${formData.action || "link"}::${formData.content}`,
      };

      const res = await doRequest("/api/admin/banner", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { ...payload, id: editingId } : payload,
        ),
      });

      if (res.status === 200) {
        setShowForm(false);
        fetchBanners();
      }
    } catch (error) {
      console.error("操作失败", error);
      messageApi.error("操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setPreviewImage(banner.banner_image);
    const [action, content] = banner.action.split("::");
    setFormData({
      banner_image: banner.banner_image,
      action: action,
      status: banner.status,
      lane: banner.lane,
      content: content,
      name: banner.name,
      type: banner.type || "normal",
    });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setPreviewImage(null);
    setFormData(createEmptyFormData());
    setShowForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      {contextHolder}

      <div className="mb-6 flex items-center justify-between">
        <Typography.Title level={3} style={{ margin: 0 }}>
          Banner管理
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
          新增Banner
        </Button>
      </div>

      <Modal
        open={showForm}
        title={editingId ? "编辑Banner" : "新增Banner"}
        onCancel={() => setShowForm(false)}
        footer={null}
        maskClosable={false}
        width={480}
      >
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="图片">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {previewImage && (
                <Image
                  src={previewImage}
                  alt="Banner Preview"
                  width={160}
                  height={90}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                />
              )}
              <Upload
                accept="image/*"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  setPreviewImage(URL.createObjectURL(file));
                  setFormData((prev) => ({ ...prev, banner_image: file }));
                  // 返回 false 阻止自动上传，保存时再统一上传
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>选择图片</Button>
              </Upload>
              {!formData.banner_image && (
                <Typography.Text type="secondary">未上传图片</Typography.Text>
              )}
            </Space>
          </Form.Item>

          <Form.Item label="名称">
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="请输入运营名称"
            />
          </Form.Item>

          <Form.Item label="类型">
            <Select
              value={formData.type}
              options={typeOptions}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as BannerFormData["type"],
                }))
              }
            />
          </Form.Item>

          <Form.Item label="Action">
            <Select
              value={formData.action}
              options={actionOptions}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, action: value }))
              }
            />
          </Form.Item>

          <Form.Item label="状态">
            <Select
              value={formData.status}
              options={statusOptions}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            />
          </Form.Item>

          <Form.Item label="内容">
            <Input
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="请输入Banner内容"
            />
          </Form.Item>

          <div className="flex gap-3 pt-2">
            <Button type="primary" htmlType="submit" loading={submitting} block>
              保存
            </Button>
            <Button block onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </Form>
      </Modal>

      <Typography.Title level={5}>Banner列表</Typography.Title>

      <Spin spinning={loading}>
        {banners.length === 0 && !loading ? (
          <Empty description="暂无Banner数据" />
        ) : (
          <Row gutter={[16, 16]}>
            {banners.map((banner) => (
              <Col key={banner.id} xs={24} sm={12} xl={8}>
                <Card
                  hoverable
                  cover={
                    <Image
                      src={banner.banner_image}
                      alt={banner.name || "Banner Image"}
                      style={{
                        width: "100%",
                        height: 160,
                        objectFit: "cover",
                      }}
                    />
                  }
                  actions={[
                    <Button
                      key="edit"
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(banner)}
                    >
                      编辑
                    </Button>,
                  ]}
                >
                  <Descriptions
                    size="small"
                    column={1}
                    colon={false}
                    styles={{ label: { width: 56 } }}
                  >
                    <Descriptions.Item label="名称">
                      {banner.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">
                      {typeLabelMap[banner.type] || banner.type}
                    </Descriptions.Item>
                    <Descriptions.Item label="Action">
                      {banner.action.split("::")[0]}
                    </Descriptions.Item>
                    <Descriptions.Item label="内容">
                      {banner.action.split("::")[1]}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={banner.status === "active" ? "green" : "red"}>
                        {banner.status}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
}
