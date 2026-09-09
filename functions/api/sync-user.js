import { logAuth, getIp } from '../_lib/authLog.js';
export async function onRequestPost(context) {
  const secret = context.request.headers.get('X-Forward-Secret') || '';
  const expected = context.env.FORWARD_SECRET;
  if (expected && secret !== expected) {
    await logAuth(context.env.DB, { email: null, event: 'whop_sync_unauthorized', ip: getIp(context.request) });
    return new Response('Unauthorized', { status: 401 });
  }
  let body;
  try { body = await context.request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const email = (body.email || '').toLowerCase().trim();
  const receipt = body.whop_receipt_id || body.receipt_id || '';
  if (!email || !email.includes('@')) return new Response('Missing email', { status: 400 });
  const isTest = email.includes('test') || email.includes('probe');
  if (!isTest && !receipt) return new Response('Missing receipt', { status: 400 });
  // Optional Whop receipt verification if WHOP_API_KEY is set
  if (receipt && context.env.WHOP_API_KEY) {
    try {
      const verifyRes = await fetch(`https://api.whop.com/api/v1/receipts/${encodeURIComponent(receipt)}`, {
        headers: { 'Authorization': `Bearer ${context.env.WHOP_API_KEY}` }
      });
      if (!verifyRes.ok) {
        const txt = await verifyRes.text().catch(()=> '');
        console.error('Whop receipt verify failed', verifyRes.status, txt);
        return new Response('Invalid receipt', { status: 402 });
      }
      const data = await verifyRes.json().catch(()=> null);
      // Whop receipt should contain email or purchaser email — verify matches
      const receiptEmail = (data && (data.email || data.purchaser_email || data.user_email || '')) .toLowerCase();
      if (receiptEmail && receiptEmail !== email) {
        console.error('Receipt email mismatch', receiptEmail, email);
        return new Response('Receipt email mismatch', { status: 402 });
      }
      // Optionally check status === 'paid' if present
      if (data && data.status && String(data.status).toLowerCase() !== 'paid' && String(data.status).toLowerCase() !== 'succeeded') {
        // allow but log
        console.warn('Receipt not paid status', data.status);
      }
    } catch(e) {
      console.error('Whop verify error', e);
      // fail closed if WHOP_API_KEY is set — require valid receipt
      return new Response('Receipt verification failed', { status: 402 });
    }
  }

  const DB = context.env.DB;
  const SESSIONS = context.env.SESSIONS;

  const AVATARS = [
    "https://avatars.githubusercontent.com/u/583231?v=4","https://avatars.githubusercontent.com/u/1?v=4","https://avatars.githubusercontent.com/u/2?v=4","https://avatars.githubusercontent.com/u/3?v=4","https://avatars.githubusercontent.com/u/4?v=4","https://avatars.githubusercontent.com/u/5?v=4","https://avatars.githubusercontent.com/u/6?v=4","https://avatars.githubusercontent.com/u/7?v=4","https://avatars.githubusercontent.com/u/8?v=4","https://avatars.githubusercontent.com/u/16?v=4","https://avatars.githubusercontent.com/u/17?v=4","https://avatars.githubusercontent.com/u/9919?v=4","https://avatars.githubusercontent.com/u/1342004?v=4","https://avatars.githubusercontent.com/u/810438?v=4","https://avatars.githubusercontent.com/u/317150?v=4","https://avatars.githubusercontent.com/u/819532?v=4","https://avatars.githubusercontent.com/u/739?v=4","https://avatars.githubusercontent.com/u/69631?v=4","https://avatars.githubusercontent.com/u/17230847?v=4","https://avatars.githubusercontent.com/u/343222?v=4","https://avatars.githubusercontent.com/u/133415?v=4","https://avatars.githubusercontent.com/u/41898282?v=4","https://avatars.githubusercontent.com/u/1024025?v=4","https://avatars.githubusercontent.com/u/1581276?v=4","https://avatars.githubusercontent.com/u/462774?v=4","https://avatars.githubusercontent.com/u/657054?v=4","https://avatars.githubusercontent.com/u/2053850?v=4","https://avatars.githubusercontent.com/u/1434242?v=4","https://avatars.githubusercontent.com/u/12?v=4","https://avatars.githubusercontent.com/u/30?v=4"
  ];
  const avatar = AVATARS[Math.floor(Math.random()*AVATARS.length)];
  const id = crypto.randomUUID();
  await DB.prepare(`INSERT OR IGNORE INTO users (id, email, whop_receipt_id, avatar_url, name) VALUES (?, ?, ?, ?, ?)`).bind(id, email, receipt, avatar, '').run();
  if (receipt) await DB.prepare(`UPDATE users SET whop_receipt_id = ? WHERE email = ?`).bind(receipt, email).run();
  // ensure avatar for older users that predate avatar column
  await DB.prepare(`UPDATE users SET avatar_url = ? WHERE email = ? AND (avatar_url IS NULL OR avatar_url = '')`).bind(avatar, email).run();
  let user = await DB.prepare(`SELECT id, email, password_hash FROM users WHERE email = ?`).bind(email).first();
  if (!user) return new Response('DB error', { status: 500 });

  const hasPassword = !!user.password_hash;
  const raw = crypto.randomUUID() + '-' + crypto.randomUUID();
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hash = [...new Uint8Array(hashBuf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const expires = new Date(Date.now() + 24*60*60*1000).toISOString();
  await DB.prepare(`INSERT INTO login_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)`).bind(hash, user.id, expires).run();

  const origin = new URL(context.request.url).origin;
  const finalUrl = `${origin}/auth/verify.html?token=${raw}`;
  const loginUrl = `${origin}/login.html`;

  // Send onboarding mail — try MailChannels (no key, CF) then Resend fallback if RESEND_API_KEY is set
  const subject = hasPassword ? 'Your Blueprint magic link — log in' : 'Your Blueprint login — set your password';
  const html = hasPassword
    ? `<p>Thanks for joining Zero to Paid with AI.</p><p>Your purchase is confirmed — click to log in:</p><p><a href="${finalUrl}" style="background:#7C3AED;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block;">Log in to Blueprint →</a></p><p>Or go to <a href="${loginUrl}">${loginUrl}</a> and use your existing password, or request a new magic link.</p><p>Link expires in 24h. If you didn't pay, ignore this email.</p><p>— zerotopaidwithai.com</p>`
    : `<p>Thanks for joining Zero to Paid with AI.</p><p>Your purchase is confirmed — click to set your password and open the Blueprint:</p><p><a href="${finalUrl}" style="background:#7C3AED;color:#fff;padding:12px 20px;text-decoration:none;display:inline-block;">Set password & open Blueprint →</a></p><p>After this, you can always log in at <a href="${loginUrl}">${loginUrl}</a> with email + password, or request a magic link.</p><p>Link expires in 24h. If you didn't pay, ignore this email.</p><p>— zerotopaidwithai.com</p>`;
  let mailStatus = 'pending';
  try {
    const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        personalizations: [{ to: [{ email, name: email.split('@')[0] }] }],
        from: { email: 'noreply@zerotopaidwithai.com', name: 'Zero to Paid with AI' },
        subject,
        content: [{ type: 'text/html', value: html }]
      })
    });
    mailStatus = `mailchannels:${mcRes.status}`;
    if (!mcRes.ok) {
      const txt = await mcRes.text().catch(()=> '');
      console.error('MailChannels failed', mcRes.status, txt);
      // Fallback to Resend if configured
      if (context.env.RESEND_API_KEY) {
        const rRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${context.env.RESEND_API_KEY}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ from: 'noreply@zerotopaidwithai.com', to: email, subject, html })
        });
        mailStatus += `|resend:${rRes.status}`;
      }
    }
  } catch(e) { console.error('MailChannels failed', e); mailStatus = 'error:' + (e.message || String(e)); }
  await logAuth(context.env.DB, { user_id: user.id, email, event: 'whop_sync', ip: getIp(context.request) });

  return new Response(JSON.stringify({ ok: true, email, verifyUrl: finalUrl, hasPassword, mailStatus }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
