export async function onRequestPost(context) {
  const secret = context.request.headers.get('X-Forward-Secret') || '';
  const expected = context.env.FORWARD_SECRET;
  if (expected && secret !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }
  let body;
  try { body = await context.request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const email = (body.email || '').toLowerCase().trim();
  const receipt = body.whop_receipt_id || body.receipt_id || '';
  if (!email || !email.includes('@')) return new Response('Missing email', { status: 400 });

  const DB = context.env.DB;
  const SESSIONS = context.env.SESSIONS;

  const id = crypto.randomUUID();
  await DB.prepare(`INSERT OR IGNORE INTO users (id, email, whop_receipt_id) VALUES (?, ?, ?)`).bind(id, email, receipt).run();
  let user = await DB.prepare(`SELECT id, email FROM users WHERE email = ?`).bind(email).first();
  if (!user) return new Response('DB error', { status: 500 });

  const raw = crypto.randomUUID() + '-' + crypto.randomUUID();
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hash = [...new Uint8Array(hashBuf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const expires = new Date(Date.now() + 24*60*60*1000).toISOString();
  await DB.prepare(`INSERT INTO login_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)`).bind(hash, user.id, expires).run();

  const verifyUrl = new URL(`/auth/verify?token=${raw}`, context.request.url).toString().replace('/api/sync-user', '');
  // Use request origin for app domain
  const origin = new URL(context.request.url).origin;
  const finalUrl = `${origin}/auth/verify?token=${raw}`;

  // Send via MailChannels (no key, works on CF)
  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        personalizations: [{ to: [{ email, name: email.split('@')[0] }] }],
        from: { email: 'noreply@zerotopaidwithai.com', name: 'Zero to Paid with AI' },
        subject: 'Your Blueprint login — set your password',
        content: [{ type: 'text/html', value: `<p>Thanks for joining Zero to Paid with AI.</p><p>Click to set your password and access the Blueprint:</p><p><a href="${finalUrl}" style="background:#7C3AED;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block;">Set password & open Blueprint →</a></p><p>Link expires in 24h. If you didn't pay, ignore this email.</p><p>— zerotopaidwithai.com</p>` }]
      })
    });
  } catch(e) { console.error('MailChannels failed', e); }

  return new Response(JSON.stringify({ ok: true, email, verifyUrl: finalUrl }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
