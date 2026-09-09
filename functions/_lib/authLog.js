export async function logAuth(DB, { user_id, email, event, ip }){
  try{
    await DB.prepare(`INSERT INTO auth_logs (user_id, email, event, ip) VALUES (?, ?, ?, ?)`).bind(user_id || null, email || null, event, ip || null).run();
  }catch(e){ console.error('authLog failed', e); }
}
export function getIp(request){
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}
