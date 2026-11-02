"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  CheckCircleOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  MenuOutlined,
  PictureOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Collapse,
  Drawer,
  Empty,
  Image,
  Space,
  Spin,
  Tooltip,
  Typography,
  Upload,
  message as antdMessage,
} from "antd";
import {
  Bubble,
  Conversations,
  Prompts,
  Sender,
  ThoughtChain,
  Welcome,
  type ThoughtChainItem,
} from "@ant-design/x";

import {
  MAX_AGENT_HISTORY_LENGTH,
  MAX_AGENT_MESSAGE_LENGTH,
  streamAgentChat,
} from "../sse";
import { imageFileToBase64 } from "../imageBase64";
import type {
  TAgentConversation,
  TAgentEvent,
  TAgentExecution,
  TAgentMessage,
} from "../types";
import { AgentMarkdown } from "./AgentMarkdown";

const STORAGE_KEY = "whale-learning-agent-conversations-v1";
const INITIAL_CONVERSATION_ID = "conversation-initial";

// TODO(style): 当前使用 Ant Design / Ant Design X 默认视觉，后续按品牌规范统一细化。
const makeId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const createConversation = (): TAgentConversation => {
  const now = Date.now();
  return {
    id: makeId("conversation"),
    title: "新对话",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
};

const initialConversation = (): TAgentConversation => ({
  id: INITIAL_CONVERSATION_ID,
  title: "新对话",
  messages: [],
  createdAt: 0,
  updatedAt: 0,
});

const titleFromMessage = (message: string) => {
  const compact = message.replace(/\s+/g, " ").trim();
  return compact.length > 24 ? `${compact.slice(0, 24)}…` : compact;
};

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const historyFrom = (messages: TAgentMessage[]) =>
  messages
    .filter(
      (message) =>
        message.content.trim() &&
        (message.role === "user" || message.role === "assistant"),
    )
    .slice(-MAX_AGENT_HISTORY_LENGTH)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_AGENT_MESSAGE_LENGTH),
    }));

const executionIcon = (execution: TAgentExecution) => {
  if (execution.stage === "end") return <CheckCircleOutlined />;
  if (execution.stage === "error") return <WarningOutlined />;
  if (execution.stage === "start") return <ClockCircleOutlined />;
  return <RobotOutlined />;
};

const executionStatus = (
  execution: TAgentExecution,
): ThoughtChainItem["status"] => {
  if (execution.stage === "end") return "success";
  if (execution.stage === "error") return "error";
  return "pending";
};

function AssistantMessage({ message }: { message: TAgentMessage }) {
  const thoughtItems = useMemo<ThoughtChainItem[]>(() => {
    const items: ThoughtChainItem[] = [];

    message.executions.forEach((execution, index) => {
      items.push({
        key: execution.id,
        title: execution.tool || `工具执行 ${index + 1}`,
        icon: executionIcon(execution),
        description: execution.stage,
        status: executionStatus(execution),
        content: <AgentMarkdown content={execution.content} compact />,
      });
    });

    return items;
  }, [message]);

  return (
    <Card
      size="small"
      className="w-full max-w-[calc(100vw-88px)] border-gray-200 shadow-none sm:max-w-[720px]"
      classNames={{ body: "!p-3" }}
    >
      {thoughtItems.length > 0 ? (
        <Collapse
          ghost
          size="small"
          className="mb-3"
          defaultActiveKey={["agent-process"]}
          items={[
            {
              key: "agent-process",
              label: "执行过程",
              children: (
                <ThoughtChain
                  items={thoughtItems}
                  collapsible
                  classNames={{ itemContent: "max-h-52 overflow-y-auto" }}
                />
              ),
            },
          ]}
        />
      ) : null}

      {message.content ? (
        <AgentMarkdown content={message.content} />
      ) : message.status === "streaming" ? (
        <Space className="py-2 text-gray-500">
          <Spin size="small" />
          <span>助手正在分析并组织回答...</span>
        </Space>
      ) : null}

      {message.error ? (
        <Alert
          className="mt-3"
          type="error"
          showIcon
          message="本次回答没有正常完成"
          description={message.error}
        />
      ) : null}

      {message.durationMs ? (
        <Typography.Text className="mt-3 block text-xs text-gray-400">
          用时 {(message.durationMs / 1000).toFixed(1)} 秒
        </Typography.Text>
      ) : null}
    </Card>
  );
}

const suggestions = [
  {
    key: "plan",
    icon: "🗓️",
    label: "制定一周学习计划",
    description: "按年级、科目和考试日期安排复习",
  },
  {
    key: "solve",
    icon: "🧮",
    label: "讲解一道数学题",
    description: "分步骤解释思路、公式和易错点",
  },
  {
    key: "wrong",
    icon: "📕",
    label: "分析我的错题",
    description: "归纳薄弱知识点并给出练习建议",
  },
  {
    key: "review",
    icon: "📚",
    label: "制定期中复习方案",
    description: "梳理重点章节与每日任务",
  },
];

export function LearningAgentPage({ openid }: { openid: string }) {
  const [conversations, setConversations] = useState<TAgentConversation[]>([
    initialConversation(),
  ]);
  const [activeConversationId, setActiveConversationId] = useState(
    INITIAL_CONVERSATION_ID,
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [pendingImage, setPendingImage] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === activeConversationId,
    ) ?? conversations[0];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as {
          conversations?: TAgentConversation[];
          activeConversationId?: string;
        };
        if (stored.conversations?.length) {
          const restored = stored.conversations.map((conversation) => ({
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.status === "streaming"
                ? { ...message, status: "stopped" as const }
                : message,
            ),
          }));
          setConversations(restored);
          const activeExists = restored.some(
            (conversation) => conversation.id === stored.activeConversationId,
          );
          setActiveConversationId(
            activeExists ? String(stored.activeConversationId) : restored[0].id,
          );
        }
      }
    } catch {
      // 本地历史损坏时直接从新会话开始，不阻塞聊天。
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ conversations, activeConversationId }),
      );
    } catch {
      // 存储空间不足或浏览器禁用 localStorage 时，不影响当前会话继续使用。
    }
  }, [activeConversationId, conversations, isHydrated]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const updateConversation = (
    conversationId: string,
    updater: (conversation: TAgentConversation) => TAgentConversation,
  ) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? updater(conversation)
          : conversation,
      ),
    );
  };

  const updateMessage = (
    conversationId: string,
    messageId: string,
    updater: (message: TAgentMessage) => TAgentMessage,
  ) => {
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: Date.now(),
      messages: conversation.messages.map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    }));
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const createNewConversation = () => {
    stopGeneration();
    const conversation = createConversation();
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
    setDrawerOpen(false);
    setInput("");
  };

  const switchConversation = (conversationId: string) => {
    if (conversationId === activeConversationId) {
      setDrawerOpen(false);
      return;
    }
    stopGeneration();
    setActiveConversationId(conversationId);
    setDrawerOpen(false);
  };

  const removeConversation = (conversationId: string) => {
    if (isLoading && conversationId === activeConversationId) {
      stopGeneration();
    }

    const remaining = conversations.filter(
      (conversation) => conversation.id !== conversationId,
    );
    const nextConversations =
      remaining.length > 0 ? remaining : [createConversation()];
    setConversations(nextConversations);

    if (conversationId === activeConversationId) {
      setActiveConversationId(nextConversations[0].id);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      antdMessage.error("只支持上传图片文件");
      return Upload.LIST_IGNORE;
    }

    setIsProcessingImage(true);
    try {
      setPendingImage(await imageFileToBase64(file));
    } catch (error) {
      antdMessage.error(
        error instanceof Error ? error.message : "图片处理失败，请重新选择",
      );
    } finally {
      setIsProcessingImage(false);
    }

    return Upload.LIST_IGNORE;
  };

  const send = async (rawMessage: string) => {
    const message = rawMessage.trim().slice(0, MAX_AGENT_MESSAGE_LENGTH);
    const imageBase64 = pendingImage;
    if (
      (!message && !imageBase64) ||
      isLoading ||
      isProcessingImage ||
      !openid ||
      !activeConversation
    ) {
      return;
    }

    const conversationId = activeConversation.id;
    const userMessages: TAgentMessage[] = [];
    if (imageBase64) {
      userMessages.push({
        id: makeId("user-image"),
        role: "user",
        content: "",
        imageBase64,
        thinking: "",
        executions: [],
        status: "done",
      });
    }
    if (message) {
      userMessages.push({
        id: makeId("user"),
        role: "user",
        content: message,
        thinking: "",
        executions: [],
        status: "done",
      });
    }
    const assistantId = makeId("assistant");
    const assistantMessage: TAgentMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      thinking: "",
      executions: [],
      status: "streaming",
    };
    const history = historyFrom(activeConversation.messages);
    const serverConversationId =
      activeConversation.serverConversationId || activeConversation.id;

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title:
        conversation.messages.length === 0
          ? titleFromMessage(message || "图片问答")
          : conversation.title,
      messages: [...conversation.messages, ...userMessages, assistantMessage],
      updatedAt: Date.now(),
    }));

    setInput("");
    setPendingImage("");
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let failed = false;

    try {
      await streamAgentChat({
        openid,
        message: message || "请分析这张图片",
        imageBase64: imageBase64 || undefined,
        conversationId: serverConversationId,
        history,
        signal: controller.signal,
        onEvent(event: TAgentEvent) {
          if (event.type === "session") {
            updateConversation(conversationId, (conversation) => ({
              ...conversation,
              serverConversationId: event.conversationId,
            }));
            return;
          }

          if (failed) return;

          if (event.type === "thinking") {
            updateMessage(conversationId, assistantId, (current) => ({
              ...current,
              thinking: current.thinking + event.content,
            }));
            return;
          }

          if (event.type === "execution") {
            updateMessage(conversationId, assistantId, (current) => ({
              ...current,
              executions: [
                ...current.executions,
                {
                  id: makeId("execution"),
                  stage: event.stage,
                  tool: event.tool,
                  content: event.content,
                },
              ],
            }));
            return;
          }

          if (event.type === "answer") {
            updateMessage(conversationId, assistantId, (current) => ({
              ...current,
              content: current.content + event.content,
            }));
            return;
          }

          if (event.type === "done") {
            updateMessage(conversationId, assistantId, (current) => ({
              ...current,
              status: "done",
              requestId: event.requestId || current.requestId,
              durationMs: event.durationMs,
            }));
            return;
          }

          if (event.type === "error") {
            failed = true;
            updateMessage(conversationId, assistantId, (current) => ({
              ...current,
              status: "error",
              error: event.message,
            }));
          }
        },
      });

      if (!failed) {
        updateMessage(conversationId, assistantId, (current) =>
          current.status === "streaming"
            ? { ...current, status: "done" }
            : current,
        );
      }
    } catch (error) {
      if (isAbortError(error)) {
        updateMessage(conversationId, assistantId, (current) => ({
          ...current,
          status: "stopped",
        }));
      } else {
        updateMessage(conversationId, assistantId, (current) => ({
          ...current,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "学习助手连接失败，请稍后重试",
        }));
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const conversationItems = conversations.map((conversation) => ({
    key: conversation.id,
    label: conversation.title,
    icon: <RobotOutlined />,
  }));

  const ConversationPanel = (
    <div className="flex h-full flex-col gap-4">
      <Button
        block
        type="primary"
        icon={<PlusOutlined />}
        onClick={createNewConversation}
      >
        新建对话
      </Button>
      <Typography.Text className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
        最近会话
      </Typography.Text>
      {conversationItems.length > 0 ? (
        <Conversations
          items={conversationItems}
          activeKey={activeConversationId}
          onActiveChange={switchConversation}
          menu={(conversation) => ({
            items: [
              {
                key: "delete",
                label: "删除会话",
                icon: <DeleteOutlined />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === "delete") {
                removeConversation(String(conversation.key));
              }
            },
          })}
          className="min-h-0 flex-1 overflow-y-auto"
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无会话" />
      )}
      <Typography.Text className="text-xs text-gray-400">
        会话记录保存在当前浏览器中。
      </Typography.Text>
    </div>
  );

  const bubbleItems = (activeConversation?.messages ?? []).map((message) => ({
    key: message.id,
    role: message.role,
    variant: message.imageBase64 ? ("borderless" as const) : undefined,
    content: message.imageBase64 ? (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={message.imageBase64}
          alt="用户上传的图片"
          className="block h-auto max-h-[360px] w-full max-w-[280px] object-contain"
        />
      </div>
    ) : message.role === "assistant" ? (
      <AssistantMessage message={message} />
    ) : (
      message.content
    ),
  }));

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-slate-50">
      <div className="mx-auto flex h-[calc(100dvh-64px)] min-h-[640px] max-w-[1440px] overflow-hidden bg-white">
        <aside className="hidden w-[280px] shrink-0 border-r border-gray-200 bg-gray-50 p-4 lg:block">
          {ConversationPanel}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <Button
              className="lg:hidden"
              icon={<MenuOutlined />}
              aria-label="打开会话列表"
              onClick={() => setDrawerOpen(true)}
            />
            <div className="min-w-0 flex-1">
              <Typography.Title level={4} className="!mb-0 truncate">
                AI 学习助手
              </Typography.Title>
              <Typography.Text className="text-xs text-gray-500">
                学习辅导 · 学习计划 · 出题与答案核验
              </Typography.Text>
            </div>
          </header>

          {!openid ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
              <Alert
                showIcon
                type="warning"
                message="缺少 openid"
                description="请从携带 ?openid=xxx 或 ?userId=xxx 的入口打开。生产环境应由可信网关注入用户身份。"
              />
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            {bubbleItems.length === 0 ? (
              <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8">
                <div className="w-full max-w-2xl">
                  <Welcome
                    variant="borderless"
                    icon={
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
                        <RobotOutlined />
                      </div>
                    }
                    title="今天想学习什么？"
                    description="我可以讲解题目、整理错题、制定学习计划，也可以帮助生成练习和核验答案。"
                  />
                  <Prompts
                    className="mt-6"
                    wrap
                    items={suggestions}
                    onItemClick={({ data }) => {
                      void send(String(data.label ?? ""));
                    }}
                  />
                </div>
              </div>
            ) : (
              <Bubble.List
                autoScroll
                className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6"
                items={bubbleItems}
                roles={{
                  user: {
                    placement: "end",
                    variant: "filled",
                    shape: "corner",
                    avatar: { icon: <UserOutlined /> },
                    classNames: { content: "!p-3 !text-[12px]" },
                  },
                  assistant: {
                    placement: "start",
                    variant: "borderless",
                    avatar: {
                      src: "/logo.svg",
                      alt: "AI 学习助手",
                    },
                    classNames: { content: "!p-0" },
                  },
                }}
              />
            )}

            <div className="border-t border-gray-200 bg-white px-3 py-3 sm:px-6">
              {pendingImage ? (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-2">
                  <Image
                    src={pendingImage}
                    alt="待发送图片"
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Typography.Text className="block font-medium text-gray-700">
                      图片已就绪
                    </Typography.Text>
                    <Typography.Text className="text-xs text-gray-500">
                      将以宽 800px 的 Base64 图片随本次消息发送
                    </Typography.Text>
                  </div>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    aria-label="移除待发送图片"
                    onClick={() => setPendingImage("")}
                  />
                </div>
              ) : null}
              <Sender
                value={input}
                onChange={(value) =>
                  setInput(value.slice(0, MAX_AGENT_MESSAGE_LENGTH))
                }
                onSubmit={(message) => {
                  void send(message);
                }}
                onKeyPress={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !input.trim() &&
                    pendingImage
                  ) {
                    event.preventDefault();
                    void send("");
                  }
                }}
                loading={isLoading}
                onCancel={stopGeneration}
                disabled={!openid || isProcessingImage}
                submitType="enter"
                autoSize={{ minRows: 1, maxRows: 5 }}
                prefix={
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    disabled={!openid || isLoading || isProcessingImage}
                    beforeUpload={handleImageUpload}
                  >
                    <Tooltip title="上传图片">
                      <Button
                        type="text"
                        icon={<PictureOutlined />}
                        loading={isProcessingImage}
                        disabled={!openid || isLoading}
                        aria-label="上传图片"
                      />
                    </Tooltip>
                  </Upload>
                }
                actions={(_, { components }) =>
                  isLoading ? (
                    <components.LoadingButton />
                  ) : (
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<SendOutlined />}
                      disabled={
                        !openid ||
                        isProcessingImage ||
                        (!input.trim() && !pendingImage)
                      }
                      aria-label="发送消息"
                      onClick={() => {
                        void send(input);
                      }}
                    />
                  )
                }
                placeholder={
                  isProcessingImage
                    ? "正在处理图片..."
                    : openid
                      ? "输入学习问题，也可以只发送图片"
                      : "缺少用户身份，暂时无法发送"
                }
                footer={
                  <div className="px-1 pt-2 text-xs text-gray-400">
                    {input.length}/{MAX_AGENT_MESSAGE_LENGTH}
                  </div>
                }
              />
              <Typography.Text className="mt-2 block text-center text-[11px] text-gray-400">
                AI 回答可能存在错误，请结合教材和老师讲解核验。
              </Typography.Text>
            </div>
          </div>
        </main>
      </div>

      <Drawer
        title="AI 学习助手"
        placement="left"
        width={300}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {ConversationPanel}
      </Drawer>
    </div>
  );
}
