import { verifyPassword, hashPassword, isOldHash } from '../../_lib/password.js';
export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const email = (body.email || '').toLowerCase().trim();
  // Accept both new plain password and old password_hash for backward compat
  const plain = body.password;
  const oldHash = body.password_hash;
  if (!email || (!plain && !oldHash)) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  const user = await context.env.DB.prepare(`SELECT id, password_hash FROM users WHERE email = ?`).bind(email).first();
  if (!user || !user.password_hash) {
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
  }
  let ok = false;
  if (plain) {
    ok = await verifyPassword(plain, user.password_hash, context.env);
    // Migration: if old hash and plain verifies, upgrade to new format
    if (ok && isOldHash(user.password_hash)) {
      const newHash = await hashPassword(plain, context.env);
      await context.env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(newHash, user.id).run();
    }
  } else if (oldHash) {
    // Old client still sends SHA-256 hex
    if (user.password_hash === oldHash) ok = true;
    else {
      // Also try verify as if oldHash is actually plain? No, old client sends hash, we compare directly for old accounts, but for new PBKDF2 accounts oldHash will never match
      ok = false;
    }
  }
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
  }
  const sess = crypto.randomUUID();
  await context.env.SESSIONS.put('sess:' + sess, user.id, { expirationTtl: 60*60*24*3 });
  try { await context.env.SESSIONS.put('usess:' + user.id + ':' + sess, '1', { expirationTtl: 60*60*24*3 }); } catch {}
  const headers = new Headers({ 'Content-Type':'application/json' });
  headers.set('Set-Cookie', `__session=${sess}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*24*3}`);
  return new Response(JSON.stringify({ ok: true }), { headers });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
