export async function onRequestGet(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const m = cookie.match(/__session=([^;]+)/);
  if (!m) return new Response(JSON.stringify({ loggedIn: false }), { status: 401, headers: { 'Content-Type':'application/json' } });
  const userId = await context.env.SESSIONS.get('sess:' + m[1]);
  if (!userId) return new Response(JSON.stringify({ loggedIn: false }), { status: 401, headers: { 'Content-Type':'application/json' } });
  const user = await context.env.DB.prepare(`SELECT email, name, avatar_url FROM users WHERE id = ?`).bind(userId).first();
  if (!user) {
    try { await context.env.SESSIONS.delete('sess:' + m[1]); } catch {}
    return new Response(JSON.stringify({ loggedIn: false }), { status: 401, headers: { 'Content-Type':'application/json' } });
  }
  return new Response(JSON.stringify({ loggedIn: true, email: user.email, name: user.name || '', avatar_url: user.avatar_url || '' }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  return new Response('Method not allowed', { status: 405 });
}
