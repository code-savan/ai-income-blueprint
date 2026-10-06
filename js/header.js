/* Shared account chrome and the existing CSRF protection. */
(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = (init.method || input?.method || 'GET').toUpperCase();
    if (method === 'POST' && url.includes('/api/')) {
      const cookie = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
      if (cookie) {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('X-CSRF-Token', decodeURIComponent(cookie[1]));
        init = {...init, headers};
      }
    }
    return originalFetch(input, init);
  };
  const toggle = document.querySelector('#menu-toggle');
  const sidebar = document.querySelector('#sidenav');
  const shade = document.querySelector('#menu-shade');
  const workspace = document.querySelector('.workspace');
  function setMenu(open) {
    if (!toggle) return;
    sidebar.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    shade.hidden = !open;
    workspace.inert = open;
    if (open) sidebar.querySelector('a').focus();
    else toggle.focus();
  }
  toggle?.addEventListener('click', () => setMenu(true));
  shade?.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => {
    if (!sidebar?.classList.contains('open')) return;
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') {
      const targets = [...sidebar.querySelectorAll('a,button'), shade];
      const first = targets[0], last = targets.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches && sidebar?.classList.contains('open')) setMenu(false); });
  const name = document.querySelector('#headerName'), avatar = document.querySelector('#headerAvatar');
  if (name) fetch('/api/profile', {credentials:'include'}).then(async r => {
    if (!r.ok) return;
    const data = await r.json();
    name.textContent = data.name?.trim() || 'My account';
    avatar.src = data.avatar_url || '/assets/brands/avatar.svg';
  }).catch(() => {});
  window.addEventListener('profileUpdated', e => {
    if (name) name.textContent = e.detail.name?.trim() || 'My account';
    if (avatar && e.detail.avatar_url) avatar.src = e.detail.avatar_url;
  });
  document.querySelector('#headerLogout')?.addEventListener('click', async () => {
    try { await fetch('/api/auth/logout', {method:'POST', credentials:'include'}); } catch {}
    location.href = '/login.html';
  });
})();
