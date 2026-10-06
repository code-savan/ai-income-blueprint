(function(){
  const nameInput=document.getElementById('nameInput'), emailInput=document.getElementById('emailInput'), avatarImg=document.getElementById('avatarImg'), avatarPreview=document.getElementById('avatarPreview'), displayName=document.getElementById('displayName'), displayEmail=document.getElementById('displayEmail'), memberSince=document.getElementById('memberSince'), progressFill=document.getElementById('progressFill'), progressLabel=document.getElementById('progressLabel'), progressText=document.getElementById('progressText'), saveMsg=document.getElementById('saveMsg');
  const circ=2*Math.PI*36;
  function setRing(pct){
    const off=circ - (pct/100)*circ;
    document.getElementById('profileProgress').style.strokeDashoffset=String(off);
  }
  async function load(){
    try{
      const r=await fetch('/api/profile',{credentials:'include'});
      if(!r.ok){ location.href='/login.html'; return;}
      const data=await r.json();
      nameInput.value=data.name||'';
      emailInput.value=data.email||'';
      avatarImg.src=data.avatar_url||'';
      avatarPreview.src=data.avatar_url||'';
      displayName.textContent=data.name||data.email.split('@')[0]||'—';
      displayEmail.textContent=data.email||'—';
      if(data.created_at){ const d=new Date(data.created_at); memberSince.textContent='Member since '+d.toLocaleDateString(); }
      const pct=data.progress?data.progress.pct:0;
      progressFill.style.width=pct+'%';
      progressLabel.textContent=pct+'%';
      progressText.textContent=(data.progress?data.progress.done:0)+' / '+(data.progress?data.progress.total:0)+' modules complete';
      setRing(pct);
    }catch(e){ setRing(0); }
  }
  load();
  document.getElementById('saveNameBtn').addEventListener('click', async()=>{
    const name=nameInput.value.trim();
    saveMsg.className='notice'; saveMsg.style.display='none';
    const r=await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({name})});
    const data=await r.json().catch(()=>({}));
    if(r.ok){
      saveMsg.textContent='Saved ✓'; saveMsg.className='notice show ok';
      displayName.textContent=name||emailInput.value.split('@')[0];
      // update header instantly
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { name, avatar_url: data.avatar_url } }));
    }
    else{ saveMsg.textContent=data.error||'Failed to save'; saveMsg.className='notice show err';}
    saveMsg.style.display='block';
  });
  document.getElementById('refreshBtn').addEventListener('click', load);
  document.getElementById('logoutBtn').addEventListener('click', async()=>{
    try{ await fetch('/api/auth/logout',{method:'POST',credentials:'include'});}catch{}
    location.href='/login.html';
  });
})();
