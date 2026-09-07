export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  const publicPaths = ['/', '/index.html', '/quiz.html', '/login', '/login.html', '/auth', '/api', '/_next', '/favicon.ico'];
  const isPublic = publicPaths.some(p => path === p || path.startsWith(p + '/')) ||
                   path.startsWith('/api/') ||
                   path.startsWith('/auth/') ||
                   path === '/login.html' ||
                   path.includes('.css') || path.includes('.js') || path.includes('.svg') || path.includes('.png') || path.includes('.jpg') || path.includes('.webp');

  const gated = path === '/checklist.html' || path.startsWith('/playbooks/') || path === '/checklist';

  if (!gated) {
    return context.next();
  }

  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/__session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return Response.redirect(new URL('/login.html', url.origin).toString(), 302);
  }

  const userId = await context.env.SESSIONS.get('sess:' + token);
  if (!userId) {
    return Response.redirect(new URL('/login.html', url.origin).toString(), 302);
  }

  return context.next();
}
