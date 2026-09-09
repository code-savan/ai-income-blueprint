export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const email = (body.email || '').toLowerCase().trim();
  if (!email || !email.includes('@')) return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400 });
  const DB = context.env.DB;
  const user = await DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
  if (!user) {
    // Always return 200 to prevent enumeration — don't reveal if email exists
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type':'application/json' } });
  }
  const raw = crypto.randomUUID() + '-' + crypto.randomUUID();
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hash = [...new Uint8Array(hashBuf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const expires = new Date(Date.now() + 60*60*1000).toISOString();
  await DB.prepare(`INSERT INTO login_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)`).bind(hash, user.id, expires).run();
  const origin = new URL(context.request.url).origin;
  const url = `${origin}/auth/verify?token=${raw}`;
  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@zerotopaidwithai.com', name: 'Zero to Paid with AI' },
        subject: 'Your magic login link',
        content: [{ type: 'text/html', value: `<p>Here is your login link (1h):</p><p><a href="${url}" style="background:#7C3AED;color:#fff;padding:12px 20px;text-decoration:none;">Log in →</a></p><p>${url}</p>` }]
      })
    });
  } catch(e) {}
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
