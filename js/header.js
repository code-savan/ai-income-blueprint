(function(){
  const style = document.createElement('style');
  style.textContent = `
  .app-header{position:sticky;top:0;z-index:120;background:var(--paper-raised,#fff);border-bottom:1px solid var(--line,#E3DCC9);backdrop-filter:blur(8px);}
  .app-header-inner{max-width:1380px;margin:0 auto;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
  .app-header-left{display:flex;flex-direction:column;gap:2px;}
  .app-header-kicker{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint,#948C7C);}
  .app-header-title{font-family:'Big Shoulders Display',sans-serif;font-weight:800;font-size:15px;letter-spacing:-.01em;color:var(--ink,#1E1A16);}
  .app-header-right{display:flex;align-items:center;gap:12px;}
  .app-header-user{display:flex;flex-direction:column;align-items:flex-end;gap:1px;max-width:160px;}
  .header-name{font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:13px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}
  .header-email{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--ink-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}
  .avatar-ring{position:relative;width:40px;height:40px;flex-shrink:0;}
  .avatar-ring svg{position:absolute;inset:0;width:40px;height:40px;transform:rotate(-90deg);}
  .avatar-ring circle{fill:none;stroke-width:3;stroke-linecap:round;}
  .avatar-ring .bg{stroke:#E5E7EB;}
  .avatar-ring .fg{stroke:#7C3AED;transition:stroke-dashoffset .6s ease;}
  .avatar-ring img{position:absolute;inset:3px;width:34px;height:34px;border-radius:50%;object-fit:cover;background:#fff;}
  .header-logout{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;background:var(--ink);color:#fff;border:1px solid var(--ink);padding:7px 12px;cursor:pointer;}
  .header-logout:hover{background:var(--paper);color:var(--ink);}
  .header-profile-link{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;}
  @media(max-width:900px){.app-header-right{ gap:8px;} .app-header-user{display:none;} .avatar-ring{width:34px;height:34px;} .avatar-ring img{width:28px;height:28px;inset:3px;} .avatar-ring svg{width:34px;height:34px;}}
  `;
  document.head.appendChild(style);

  const header = document.createElement('header');
  header.className = 'app-header';
  header.id = 'app-header';
  header.innerHTML = `
    <div class="app-header-inner">
      <div class="app-header-left">
        <span class="app-header-kicker">Blueprint</span>
        <span class="app-header-title">AI Income Blueprint</span>
      </div>
      <div class="app-header-right">
        <a href="/profile.html" class="header-profile-link" id="headerProfileLink" style="text-decoration:none;">
          <div class="app-header-user">
            <span class="header-name" id="headerName">—</span>
            <span class="header-email" id="headerEmail">—</span>
          </div>
          <div class="avatar-ring" id="avatarRing" title="Blueprint progress">
            <svg viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="17"/><circle class="fg" id="avatarProgress" cx="20" cy="20" r="17" stroke-dasharray="106.81" stroke-dashoffset="106.81"/></svg>
            <img id="headerAvatar" src="" alt="avatar">
          </div>
        </a>
        <button class="header-logout" id="headerLogout">Log out</button>
      </div>
    </div>
  `;
  // Insert at top of .main if exists, else body
  const main = document.querySelector('.main');
  if (main) main.insertBefore(header, main.firstChild);
  else document.body.insertBefore(header, document.body.firstChild);

  const circumference = 2 * Math.PI * 17; // 106.81
  function setProgress(pct){
    const circle = document.getElementById('avatarProgress');
    if(!circle) return;
    const offset = circumference - (pct/100)*circumference;
    circle.style.strokeDashoffset = String(offset);
  }

  async function load(){
    try{
      const r = await fetch('/api/profile', { credentials:'include' });
      if(!r.ok) {
        document.getElementById('headerName').textContent = 'Guest';
        document.getElementById('headerEmail').textContent = '';
        document.getElementById('headerAvatar').src = 'https://avatars.githubusercontent.com/u/583231?v=4';
        setProgress(0);
        return;
      }
      const data = await r.json();
      const name = (data.name || '').trim();
      const displayName = name || data.email.split('@')[0] || '—';
      document.getElementById('headerName').textContent = displayName;
      document.getElementById('headerEmail').textContent = data.email || '';
      document.getElementById('headerAvatar').src = data.avatar_url || 'https://avatars.githubusercontent.com/u/583231?v=4';
      const pct = data.progress ? data.progress.pct : 0;
      setProgress(pct);
      const ring = document.getElementById('avatarRing');
      if(ring) ring.title = pct + '% complete — ' + (data.progress ? data.progress.done + '/' + data.progress.total + ' modules' : '');
    }catch(e){
      setProgress(0);
    }
  }
  load();
  window.addEventListener('journalProgress', (e)=>{
    if(e.detail && typeof e.detail.pct === 'number'){
      setProgress(e.detail.pct);
      const ring = document.getElementById('avatarRing');
      if(ring) ring.title = e.detail.pct + '% — ' + e.detail.done + '/' + e.detail.total + ' tasks';
    }
  });
  window.addEventListener('profileUpdated', (e)=>{
    if(e.detail && e.detail.name !== undefined){
      const name = (e.detail.name || '').trim();
      const email = document.getElementById('headerEmail').textContent || '';
      document.getElementById('headerName').textContent = name || email.split('@')[0] || '—';
    }
    if(e.detail && e.detail.avatar_url){
      document.getElementById('headerAvatar').src = e.detail.avatar_url;
    }
  });

  document.addEventListener('click', async (e)=>{
    if(e.target && e.target.id === 'headerLogout'){
      try{ await fetch('/api/auth/logout', { method:'POST', credentials:'include' }); }catch{}
      location.href = '/login.html';
    }
  });
})();
