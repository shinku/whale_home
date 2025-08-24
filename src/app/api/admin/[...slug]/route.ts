// app/api/users/[id]/route.js

import { getApiHost } from "@/utils";
import { NextRequest, NextResponse } from "next/server";



type TRouteContext = {
  params: Promise<{
    slug: string[]
  }>
};

// app/api/users/route.js

export async function GET(request:NextRequest, option:TRouteContext) {
  return handleRequest(request, option);
}
export async function POST(request:NextRequest, {params}:TRouteContext) {
  return handleRequest(request, {params});
}
export async function PUT(request:NextRequest, {params}:TRouteContext) {
  return handleRequest(request, {params});
}
export async function DELETE(request:NextRequest, {params}:TRouteContext) {
  return handleRequest(request, {params});
}

async function handleRequest(request:NextRequest,{params}:TRouteContext) {
  const {slug} = await params;
  // 
  let distnay = getApiHost()+"admin/"+slug.join('/');
  const querys = request.nextUrl.searchParams;
  if (querys) {
    const queryString = querys.toString();
    if (queryString) {
      distnay += `?${queryString}`;
    }
  }
  const headerObject = Object.fromEntries(request.headers.entries());
  console.log(111111);
  console.log({
    headerObject
  })
  // const header = request.headers.
  switch (request.method) {
    case 'GET':
      return fetch(distnay, {
        method: 'GET',
        headers: {
          ...headerObject,
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        }
      }).then(res => {
        if (!res.ok) {
          return NextResponse.json({ error: 'Failed to fetch data' }, { status: res.status });
        }
        return res.json().then(data => NextResponse.json(data));
      }).catch(error => {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      });
    case "POST":
    case "PUT":
    case "DELETE":
      // 处理 POST、PUT、DELETE 请求{
      const data = (await request.json()) || {};
      return fetch(distnay, {
        method: request.method,
        headers: {
          ...headerObject,
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) {
          return NextResponse.json({ error: 'Failed to create data' }, { status: res.status });
        }
        return res.json().then(data => NextResponse.json(data));
      }).catch(error => {
        console.error('Error creating data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      });
      
                         
    default:
      return new NextResponse(null, { status: 405 });
  }
}
