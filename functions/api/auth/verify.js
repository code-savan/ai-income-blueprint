export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const raw = url.searchParams.get('token');
  if (!raw) return new Response('Missing token', { status: 400 });
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hash = [...new Uint8Array(hashBuf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const DB = context.env.DB;
  const SESSIONS = context.env.SESSIONS;
  const row = await DB.prepare(`SELECT user_id, expires_at, used FROM login_tokens WHERE token_hash = ?`).bind(hash).first();
  if (!row || row.used) return new Response('Invalid or used link', { status: 400 });
  if (new Date(row.expires_at).getTime() < Date.now()) return new Response('Link expired', { status: 400 });

  await DB.prepare(`UPDATE login_tokens SET used = 1 WHERE token_hash = ?`).bind(hash).run();
  const sess = crypto.randomUUID();
  await SESSIONS.put('sess:' + sess, row.user_id, { expirationTtl: 60*60*24*30 });

  // If user has no password yet, send to set-password, else to app
  const user = await DB.prepare(`SELECT password_hash FROM users WHERE id = ?`).bind(row.user_id).first();
  const needsPassword = !user || !user.password_hash;
  const redirect = needsPassword ? `/set-password.html?session=${sess}` : `/index.html`;

  const headers = new Headers();
  headers.set('Location', redirect);
  headers.set('Set-Cookie', `__session=${sess}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*24*30}`);
  return new Response(null, { status: 302, headers });
}
export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  return new Response('Method not allowed', { status: 405 });
}
