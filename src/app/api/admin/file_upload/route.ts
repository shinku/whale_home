import { getApiHost } from "@/utils";


export const POST = async (request: Request) => { 
  const url = getApiHost()+"api/file/upload";
  console.log(request.headers.get('content-type'));
  try{
    const formData = await request.formData();

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'File upload failed' }), { status: res.status });
    } else {
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch(e){
    console.error('File upload error:', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
  
}