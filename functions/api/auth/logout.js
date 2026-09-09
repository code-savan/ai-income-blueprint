import { logAuth, getIp } from '../../_lib/authLog.js';
export async function onRequestPost(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const m = cookie.match(/__session=([^;]+)/);
  let userIdForLog = null;
  let emailForLog = null;
  if (m) {
    const token = m[1];
    userIdForLog = await context.env.SESSIONS.get('sess:' + token).catch(()=>null);
    if(userIdForLog){
      const u = await context.env.DB.prepare(`SELECT email FROM users WHERE id = ?`).bind(userIdForLog).first().catch(()=>null);
      if(u) emailForLog = u.email;
    }
    await context.env.SESSIONS.delete('sess:' + token).catch(()=>{});
    if (userIdForLog) await context.env.SESSIONS.delete('usess:' + userIdForLog + ':' + token).catch(()=>{});
  }
  await logAuth(context.env.DB, { user_id: userIdForLog, email: emailForLog, event: 'logout', ip: getIp(context.request) });
  const headers = new Headers({ 'Content-Type':'application/json' });
  headers.set('Set-Cookie', `__session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return new Response(JSON.stringify({ ok: true }), { headers });
}
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
