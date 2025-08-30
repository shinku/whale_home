import { getApiHost } from "@/utils";

export const POST = async (request: Request) => { 
  const url = getApiHost()+"api/file/text_2_word";
  const {text} = await request.json()
  try{
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({text}),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || "",
      }
    });
    if (!res.ok) {
      console.error('Text to Word conversion failed with status:', res.status);
      return new Response(JSON.stringify({ error: 'Text to Word conversion failed' }), { status: res.status });
    } else {
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch(e){
    console.error('Text to Word conversion error:', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}