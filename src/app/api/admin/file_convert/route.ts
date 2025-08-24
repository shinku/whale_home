import { getApiHost } from "@/utils";

export const POST = async (request: Request) => { 
  let url = getApiHost()+"api/file/upload/convert_file";
  const headerObject = Object.fromEntries(request.headers.entries());
  const querys = new URL(request.url).searchParams;
  if (querys) {
    const type = querys.get('type');
    if(type){
      url += `?type=${type}`;
    }
  }
  console.log({
    url
  })
  try{
    const formData = await request.formData();
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...headerObject,
        'x-user-id': request.headers.get('x-user-id') || "",
      }
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'File convert failed' }), { status: res.status });
    } else {
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch(e){
    console.error('File convert error:', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
  
}