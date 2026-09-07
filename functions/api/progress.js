export async function onRequestGet(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const m = cookie.match(/__session=([^;]+)/);
  if (!m) return new Response('Unauthorized', { status: 401 });
  const userId = await context.env.SESSIONS.get('sess:' + m[1]);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const rows = await context.env.DB.prepare(`SELECT module, done FROM progress WHERE user_id = ?`).bind(userId).all();
  const map = {};
  for (const r of rows.results) map[r.module] = !!r.done;
  return new Response(JSON.stringify(map), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequestPost(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const m = cookie.match(/__session=([^;]+)/);
  if (!m) return new Response('Unauthorized', { status: 401 });
  const userId = await context.env.SESSIONS.get('sess:' + m[1]);
  if (!userId) return new Response('Unauthorized', { status: 401 });
  let body;
  try { body = await context.request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const mod = body.module;
  const done = body.done ? 1 : 0;
  if (!mod) return new Response('Missing module', { status: 400 });
  await context.env.DB.prepare(`INSERT INTO progress (user_id, module, done) VALUES (?, ?, ?) ON CONFLICT(user_id, module) DO UPDATE SET done=excluded.done, updated_at=CURRENT_TIMESTAMP`).bind(userId, mod, done).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
