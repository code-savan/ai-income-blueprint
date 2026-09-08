export async function onRequestPost(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const m = cookie.match(/__session=([^;]+)/);
  if (m) {
    const token = m[1];
    const userId = await context.env.SESSIONS.get('sess:' + token).catch(()=>null);
    await context.env.SESSIONS.delete('sess:' + token).catch(()=>{});
    if (userId) await context.env.SESSIONS.delete('usess:' + userId + ':' + token).catch(()=>{});
  }
  const headers = new Headers({ 'Content-Type':'application/json' });
  headers.set('Set-Cookie', `__session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return new Response(JSON.stringify({ ok: true }), { headers });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
