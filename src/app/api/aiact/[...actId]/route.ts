import { getApiHost } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request:NextRequest, {params}: {params: Promise<{actId:string[]}>}) => { 
  const {actId} = await params
  const body = await request.json();
  const userId = request.headers.get("x-user-id") 
  const url = getApiHost()
  const data = JSON.stringify({config: body, actId: actId[0]});
  const result = await fetch(url+"api/ai/activity",{
    method: "post",
    body: data,
    headers: {
      "content-type":"application/json",
      'x-user-id': userId || ""
    }
  })
  const res = await result.json();

  return NextResponse.json(res)
}

export const GET = async ()=>{
  return NextResponse.json({
    data: "get"
  })
}