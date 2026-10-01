import { getApiHost } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { lisencedPaths } from "./lisence";

// 通用代理路由：将 /api/xxxx 转发到 getApiHost() + "api/xxxx"
// 例如：当前页面请求 /api/edu/news -> getApiHost() + "api/edu/news"
// 注意：/api/admin、/api/user、/api/aiact 等已存在的具名路由优先级更高，
// 会先被各自的路由处理，不会走到这里。

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

export async function handleRequest(request: NextRequest, { params }: TRouteContext) {
  const { slug } = await params;
  
  // 目标地址：getApiHost() 自带结尾斜杠，所以这里用 "api/" 拼接，避免出现双斜杠
  let destination = getApiHost() + "api/" + slug.join("/");
  if(!lisencedPaths.includes(slug[0])){
    return NextResponse.json(
      { error: "Unauthorized path" },
      { status: 403 },
    );
  }
  const queryString = request.nextUrl.searchParams.toString();
  if (queryString) {
    destination += `?${queryString}`;
  }

  const method = request.method;

  // 转发请求头，剔除会干扰上游请求的头（host、content-length 等）
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    try {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) {
        init.body = body;
      }
    } catch (error) {
      console.error("Error reading request body:", error);
      return NextResponse.json(
        { error: "Failed to read request body" },
        { status: 400 },
      );
    }
  }

  try {
    const response = await fetch(destination, init);
    const status = response.status;

    // 204/205/304 等状态不允许携带 body，否则 Response 构造会抛错
    if (status === 204 || status === 205 || status === 304) {
      return new NextResponse(null, { status });
    }

    const text = await response.text();

    return new NextResponse(text, {
      status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Error proxying request:", { destination, error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
