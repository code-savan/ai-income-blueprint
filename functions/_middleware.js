import { checkRateLimit } from './_lib/rateLimit.js';
import { generateCsrfToken, verifyCsrf } from './_lib/csrf.js';

function addSecurityHeaders(res, csrfToken){
  const h = new Headers(res.headers);
  h.set('X-Frame-Options', 'DENY');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'credentialless');
  h.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https: data:; font-src https://fonts.gstatic.com data:; connect-src 'self' https://api.mailchannels.net https://api.resend.com");
  if(csrfToken) h.append('Set-Cookie', `csrf_token=${csrfToken}; Path=/; SameSite=Lax; Max-Age=${60*60*24*7}`);
  return new Response(res.body, { status: res.status, headers: h });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const method = context.request.method;

  // --- CSRF cookie on GET (set if missing, but don't bypass auth) ---
  let csrfToSet = null;
  if(method === 'GET'){
    const cookie = context.request.headers.get('Cookie') || '';
    if(!cookie.includes('csrf_token=')){
      csrfToSet = generateCsrfToken();
    }
  }

  // --- CSRF check for state-changing POST to /api/* (except whop sync which uses secret) ---
  if(method === 'POST' && path.startsWith('/api/') && path !== '/api/sync-user' && path !== '/api/whop-webhook' && path !== '/api/revoke-user'){
    if(!verifyCsrf(context.request)){
      return addSecurityHeaders(new Response(JSON.stringify({ error: 'CSRF failed' }), { status: 403, headers: { 'Content-Type':'application/json' } }), csrfToSet);
    }
  }

  // --- Rate limiting ---
  const ip = context.request.headers.get('CF-Connecting-IP') || context.request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
  const kv = context.env.SESSIONS;
  let rl = null;
  if(method === 'POST'){
    if(path === '/api/auth/login') rl = await checkRateLimit(kv, `rl:login:${ip}`, 10, 900);
    else if(path === '/api/auth/magic-link') rl = await checkRateLimit(kv, `rl:magic:${ip}`, 5, 3600);
    else if(path === '/api/sync-user' || path === '/api/whop-webhook') rl = await checkRateLimit(kv, `rl:sync:${ip}`, 20, 3600);
    else if(path.startsWith('/api/')) rl = await checkRateLimit(kv, `rl:api:${ip}:${path}`, 60, 60);
    if(rl && !rl.allowed){
      const headers = { 'Content-Type':'application/json', 'Retry-After': String(rl.retryAfter || 60) };
      return addSecurityHeaders(new Response(JSON.stringify({ error: 'Too many requests, try again later' }), { status: 429, headers }), csrfToSet);
    }
  }

  // --- Content-Length cap for journal (10kb) ---
  if(method === 'POST' && path.startsWith('/api/journal/')){
    const len = parseInt(context.request.headers.get('Content-Length') || '0', 10);
    if(len > 10240){
      return addSecurityHeaders(new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: { 'Content-Type':'application/json' } }), csrfToSet);
    }
  }

  const publicPaths = ['/login', '/login.html', '/set-password', '/set-password.html', '/auth', '/api', '/favicon.ico'];
  const isPublic = publicPaths.some(p => path === p || path.startsWith(p + '/')) ||
                   path.startsWith('/api/') ||
                   path.startsWith('/auth/') ||
                   path === '/login.html' ||
                   path === '/set-password.html' ||
                   path.includes('.css') || path.includes('.js') || path.includes('.svg') || path.includes('.png') || path.includes('.jpg') || path.includes('.jpeg') || path.includes('.webp') || path.includes('.woff');

  if (isPublic) {
    const res = await context.next();
    return addSecurityHeaders(res, csrfToSet);
  }

  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/__session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return addSecurityHeaders(Response.redirect(new URL('/login.html', url.origin).toString(), 302), csrfToSet);
  }

  const userId = await context.env.SESSIONS.get('sess:' + token);
  if (!userId) {
    return addSecurityHeaders(Response.redirect(new URL('/login.html', url.origin).toString(), 302), csrfToSet);
  }
  // Revoked users have no row: reject even if a session key survived
  let exists = null;
  try { exists = await context.env.DB.prepare(`SELECT id FROM users WHERE id = ?`).bind(userId).first(); } catch {}
  if (!exists) {
    try { await context.env.SESSIONS.delete('sess:' + token); } catch {}
    return addSecurityHeaders(Response.redirect(new URL('/login.html', url.origin).toString(), 302), csrfToSet);
  }

  const res = await context.next();
  return addSecurityHeaders(res, csrfToSet);
}
