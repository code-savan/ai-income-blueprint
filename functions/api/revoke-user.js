export async function onRequestPost(context) {
  const secret = context.request.headers.get('X-Forward-Secret') || '';
  const expected = context.env.FORWARD_SECRET;
  if (expected && secret !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }
  let body;
  try { body = await context.request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const email = (body.email || '').toLowerCase().trim();
  const receipt = body.whop_receipt_id || '';
  if (!email && !receipt) return new Response('Missing identifier', { status: 400 });

  const DB = context.env.DB;
  const SESSIONS = context.env.SESSIONS;
  let user = null;
  if (email) {
    try { user = await DB.prepare(`SELECT id, email FROM users WHERE email = ?`).bind(email).first(); } catch {}
  }
  if (!user && receipt) {
    try { user = await DB.prepare(`SELECT id, email FROM users WHERE whop_receipt_id = ?`).bind(receipt).first(); } catch {}
  }
  if (!user) {
    return new Response(JSON.stringify({ ok: true, revoked: false }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Kill all sessions (new ones are indexed at login/verify time)
  try {
    const idx = await SESSIONS.list({ prefix: 'usess:' + user.id + ':' });
    for (const k of idx.keys) {
      const sess = k.name.split(':').pop();
      try { await SESSIONS.delete('sess:' + sess); } catch {}
      try { await SESSIONS.delete(k.name); } catch {}
    }
  } catch (e) { console.error('revoke sessions failed', e); }

  // Burn unused login tokens
  try { await DB.prepare(`DELETE FROM login_tokens WHERE user_id = ?`).bind(user.id).run(); } catch {}

  // Delete the user row so password/magic-link re-entry is impossible
  // (user-existence checks in middleware + APIs also reject pre-existing sessions)
  try { await DB.prepare(`DELETE FROM users WHERE id = ?`).bind(user.id).run(); }
  catch (e) { console.error('revoke user delete failed', e); return new Response('DB error', { status: 500 }); }

  console.warn('user revoked', user.email);
  return new Response(JSON.stringify({ ok: true, revoked: true, email: user.email }), { headers: { 'Content-Type': 'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
