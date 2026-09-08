export async function onRequestGet(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const m = cookie.match(/__session=([^;]+)/);
  if (!m) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const userId = await context.env.SESSIONS.get('sess:' + m[1]);
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const user = await context.env.DB.prepare(`SELECT email, name, avatar_url, created_at FROM users WHERE id = ?`).bind(userId).first();
  if (!user) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  const progress = await context.env.DB.prepare(`SELECT COUNT(*) as total, SUM(done) as done FROM progress WHERE user_id = ?`).bind(userId).first();
  const total = progress ? progress.total || 0 : 0;
  const done = progress ? progress.done || 0 : 0;
  const pct = total ? Math.round((done/total)*100) : 0;
  return new Response(JSON.stringify({ email: user.email, name: user.name || '', avatar_url: user.avatar_url || '', created_at: user.created_at, progress: { total, done, pct } }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequestPost(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const m = cookie.match(/__session=([^;]+)/);
  if (!m) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const userId = await context.env.SESSIONS.get('sess:' + m[1]);
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  let body;
  try { body = await context.request.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const name = (body.name || '').trim().slice(0, 40);
  // name can be empty to clear, but we allow empty; user can update anytime
  await context.env.DB.prepare(`UPDATE users SET name = ? WHERE id = ?`).bind(name, userId).run();
  const user = await context.env.DB.prepare(`SELECT email, name, avatar_url FROM users WHERE id = ?`).bind(userId).first();
  return new Response(JSON.stringify({ ok: true, email: user.email, name: user.name || '', avatar_url: user.avatar_url || '' }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
