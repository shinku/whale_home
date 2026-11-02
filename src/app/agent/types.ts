export type TAgentExecutionStage = "start" | "end" | "error" | "note";

export type TAgentExecution = {
  id: string;
  stage: TAgentExecutionStage;
  tool?: string;
  content: string;
};

export type TAgentMessageStatus = "streaming" | "done" | "error" | "stopped";

export type TAgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  thinking: string;
  executions: TAgentExecution[];
  status: TAgentMessageStatus;
  requestId?: string;
  durationMs?: number;
  error?: string;
};

export type TAgentConversation = {
  id: string;
  serverConversationId?: string;
  title: string;
  messages: TAgentMessage[];
  createdAt: number;
  updatedAt: number;
};

export type TAgentSessionUser = {
  userName?: string;
  vipType?: string;
  vipActive?: boolean;
};

export type TAgentEvent =
  | {
      type: "session";
      requestId: string;
      conversationId: string;
      userId?: string;
      user?: TAgentSessionUser;
      format?: "json";
    }
  | { type: "thinking"; content: string; format?: "markdown" }
  | {
      type: "execution";
      stage: TAgentExecutionStage;
      tool?: string;
      content: string;
      format?: "markdown";
    }
  | { type: "answer"; content: string; format?: "markdown" }
  | {
      type: "done";
      requestId?: string;
      conversationId?: string;
      durationMs?: number;
    }
  | {
      type: "error";
      status: number;
      code?: string;
      message: string;
    };
