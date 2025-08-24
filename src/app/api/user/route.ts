import { getApiHost } from "@/utils";

// 根据/api/user获取用户信息
export const POST = async (request: Request) => { 
  const userId = request.headers.get("x-user-id");
  if(!userId){
    return new Response(JSON.stringify({ error: 'Missing x-user-id header' }), { status: 400 });
  }
  const url = getApiHost()+"api/user";
  console.log({url} )
  try{
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-id': userId
      }
    });
    if (!res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify({ error: 'Failed to fetch user info', data }), { status: res.status });
    } else {
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch(e){
    console.error('Error fetching user info:', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  } 
}