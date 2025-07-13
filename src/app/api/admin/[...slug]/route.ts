// app/api/users/[id]/route.js

import { NextRequest, NextResponse } from "next/server";

export const getApiHost = ()=>{
  const localhostHost = "http://localhost:7001/";
  const productionHost = "https://api.whalepea.com/";
  return {"development": localhostHost,"test":localhostHost, "production": productionHost}[process.env.NODE_ENV] || localhostHost;
}




// app/api/users/route.js

export async function GET(request:NextRequest,option:{params: {slug: string[]}}) {
  return handleRequest(request,option);
}
export async function POST(request:NextRequest,option:{params: {slug: string[]}}) {
  return handleRequest(request,option);
}
export async function PUT(request:NextRequest,option:{params: {slug: string[]}}) {
  return handleRequest(request,option);
}
export async function DELETE(request:NextRequest,option:{params: {slug: string[]}}) {
  return handleRequest(request,option);
}

async function handleRequest(request:NextRequest,{params}:{params: {slug: string[]}}) {
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
  console.log(request.method);
  switch (request.method) {
    case 'GET':
      return fetch(distnay, {
        method: 'GET',
        headers: {
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
      const data = await request.json();
      console.log({
        data
      })
      return fetch(distnay, {
        method: request.method,
        headers: {
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