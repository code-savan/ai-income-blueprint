export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const email = (body.email || '').toLowerCase().trim();
  const hash = body.password_hash;
  if (!email || !hash) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  const user = await context.env.DB.prepare(`SELECT id, password_hash FROM users WHERE email = ?`).bind(email).first();
  if (!user || !user.password_hash || user.password_hash !== hash) {
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
  }
  const sess = crypto.randomUUID();
  await context.env.SESSIONS.put('sess:' + sess, user.id, { expirationTtl: 60*60*24*30 });
  const headers = new Headers({ 'Content-Type':'application/json' });
  headers.set('Set-Cookie', `__session=${sess}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*24*30}`);
  return new Response(JSON.stringify({ ok: true }), { headers });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
