export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const { password, session } = body;
  if (!password || password.length < 8) return new Response(JSON.stringify({ error: 'Password must be 8+ chars' }), { status: 400 });
  let token = null;
  const url = new URL(context.request.url);
  const qs = url.searchParams.get('session');
  token = session || qs;
  if (!token) {
    const cookie = context.request.headers.get('Cookie') || '';
    const m = cookie.match(/__session=([^;]+)/);
    if (m) token = m[1];
  }
  if (!token) return new Response(JSON.stringify({ error: 'No session' }), { status: 401 });
  const userId = await context.env.SESSIONS.get('sess:' + token);
  if (!userId) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hash = [...new Uint8Array(hashBuf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  await context.env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(hash, userId).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
