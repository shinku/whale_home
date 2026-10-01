import { NextRequest, NextResponse } from "next/server";
import { proxyToApi } from "@/utils/proxy";
import { lisencedPaths } from "./lisence";

// 通用代理路由：将 /api/xxxx 转发到 getApiHost() + "api/xxxx"
// 例如：当前页面请求 /api/edu/news -> getApiHost() + "api/edu/news"
// 注意：/api/admin、/api/user、/api/aiact 等已存在的具名路由优先级更高，
// 会先被各自的路由处理，不会走到这里。
// 请求头只转发白名单里的 content-type（见 src/utils/proxy.ts），
// 其余一律丢弃，尤其不带 Authorization / x-user-id 这类认证信息。

type TRouteContext = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function GET(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function POST(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function PUT(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function PATCH(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function DELETE(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function HEAD(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function OPTIONS(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}

export async function handleRequest(
  request: NextRequest,
  { params }: TRouteContext,
) {
  const { slug } = await params;

  if (!lisencedPaths.includes(slug[0])) {
    return NextResponse.json({ error: "Unauthorized path" }, { status: 403 });
  }

  // 上游路径统一走 "api/" 前缀（getApiHost() 自带结尾斜杠）
  return proxyToApi(request, {
    path: `api/${slug.join("/")}`,
  });
}
