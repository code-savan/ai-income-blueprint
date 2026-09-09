import { logAuth, getIp } from '../_lib/authLog.js';
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const raw = url.searchParams.get('token');
  if (!raw) return new Response('Missing token', { status: 400 });
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hash = [...new Uint8Array(hashBuf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const DB = context.env.DB;
  const SESSIONS = context.env.SESSIONS;
  const row = await DB.prepare(`SELECT user_id, expires_at, used FROM login_tokens WHERE token_hash = ?`).bind(hash).first();
  if (!row || row.used) {
    await logAuth(DB, { user_id: row ? row.user_id : null, email: null, event: 'verify_fail_used', ip: getIp(context.request) });
    return new Response('Invalid or used link', { status: 400 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await logAuth(DB, { user_id: row.user_id, email: null, event: 'verify_fail_expired', ip: getIp(context.request) });
    return new Response('Link expired', { status: 400 });
  }

  await DB.prepare(`UPDATE login_tokens SET used = 1 WHERE token_hash = ?`).bind(hash).run();
  const sess = crypto.randomUUID();
  await SESSIONS.put('sess:' + sess, row.user_id, { expirationTtl: 60*60*24*3 });
  try { await SESSIONS.put('usess:' + row.user_id + ':' + sess, '1', { expirationTtl: 60*60*24*3 }); } catch {}

  // If user has no password yet, send to set-password, else to app
  const user = await DB.prepare(`SELECT email, password_hash FROM users WHERE id = ?`).bind(row.user_id).first();
  const needsPassword = !user || !user.password_hash;
  const redirect = needsPassword ? `/set-password.html?session=${sess}` : `/index.html`;
  await logAuth(DB, { user_id: row.user_id, email: user ? user.email : null, event: 'verify_success', ip: getIp(context.request) });

  const headers = new Headers();
  headers.set('Location', redirect);
  headers.set('Set-Cookie', `__session=${sess}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*24*3}`);
  return new Response(null, { status: 302, headers });
}
export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  return new Response('Method not allowed', { status: 405 });
}
