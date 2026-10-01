import { NextRequest, NextResponse } from "next/server";
import { proxyToApi } from "@/utils/proxy";

type TRouteContext = {
  params: Promise<{
    slug: string[];
  }>;
};

// 管理端代理路由：/api/admin/xxxx -> getApiHost() + "admin/xxxx"
// 与通用代理共用 src/utils/proxy.ts（请求头白名单、body 透传、错误兜底）。
const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE"];

export async function GET(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function POST(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function PUT(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}
export async function DELETE(request: NextRequest, context: TRouteContext) {
  return handleRequest(request, context);
}

export async function handleRequest(
  request: NextRequest,
  { params }: TRouteContext,
) {
  const { slug } = await params;

  if (!ALLOWED_METHODS.includes(request.method)) {
    return new NextResponse(null, { status: 405 });
  }

  return proxyToApi(request, { path: `admin/${slug.join("/")}` });
}
