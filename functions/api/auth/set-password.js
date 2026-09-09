import { hashPassword } from '../../_lib/password.js';
import { logAuth, getIp } from '../../_lib/authLog.js';
async function isPwned(password){
  try{
    const sha1Buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const sha1Hex = [...new Uint8Array(sha1Buf)].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
    const prefix = sha1Hex.slice(0,5);
    const suffix = sha1Hex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { 'Add-Padding':'true' } });
    if(!res.ok) return false; // fail open if API down
    const text = await res.text();
    return text.split('\n').some(line=> line.split(':')[0].trim() === suffix);
  }catch{ return false; }
}
export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const { password, session } = body;
  if (!password || password.length < 8) return new Response(JSON.stringify({ error: 'Password must be 8+ chars' }), { status: 400 });
  if(await isPwned(password)){
    return new Response(JSON.stringify({ error: 'This password has appeared in a data breach — choose a different one' }), { status: 400 });
  }
  let token = null;
  const url = new URL(context.request.url);
  const qs = url.searchParams.get('session');
  token = session || qs;
  if (!token) {
    const cookie = context.request.headers.get('Cookie') || '';
    const m = cookie.match(/__session=([^;]+)/);
    if (m) token = m[1];
  }
  if (!token) return new Response(JSON.stringify({ error: 'No session' }), { status: 401 });
  const userId = await context.env.SESSIONS.get('sess:' + token);
  if (!userId) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  const userRow = await context.env.DB.prepare(`SELECT email FROM users WHERE id = ?`).bind(userId).first();
  const hash = await hashPassword(password, context.env);
  await context.env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(hash, userId).run();
  // Kill all other sessions for this user (keep current)
  try{
    const list = await context.env.SESSIONS.list({ prefix: `usess:${userId}:` });
    for(const key of list.keys){
      const sessToken = key.name.split(':').pop();
      if(sessToken !== token){
        await context.env.SESSIONS.delete('sess:' + sessToken);
        await context.env.SESSIONS.delete(key.name);
      }
    }
  }catch{}
  await logAuth(context.env.DB, { user_id: userId, email: userRow ? userRow.email : null, event: 'password_change', ip: getIp(context.request) });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type':'application/json' } });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
