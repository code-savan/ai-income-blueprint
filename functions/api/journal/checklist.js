const TRACK_TEMPLATES = {
  '30-day-blueprint': [
    { title: 'Choose your track and block your first 7 days', detail: 'Foundation before tools. Run diagnostic, pick A or B, block calendar.' },
    { title: 'Set up the core stack + pick ONE store/editor', detail: 'ChatGPT, Claude, Manus, Z.ai, Canva, CapCut OR VN, 1 storefront (Gumroad/Lemon/Whop), Flow. Verify payouts.' },
    { title: 'Commit to the first $500 roadmap', detail: 'Know day-by-day target for your track. Track A 19–24d, Track B 7–11d.' },
    { title: 'Pick your first execution playbook', detail: 'A = service (7d), B = product (5d), C = funnel, D = scale after $500.' },
    { title: 'Pull 10 working prompts from Vault', detail: 'Copy, replace [brackets], run in ChatGPT/Manus/Z.ai. Use immediately.' },
    { title: 'Map your $500 → $2K path', detail: 'Levers in order: volume → price → second stream → systems.' },
    { title: 'Study the Wall of Proof', detail: 'Pattern recognition builds belief and speed.' },
    { title: 'Download and duplicate your operating sheets', detail: 'Outreach Tracker, Scorecard, SOPs — duplicate per client/product.' }
  ],
  'track-a': [
    { title: 'Validate your product idea (score 7+)', detail: 'Use Validation Worksheet. If <7, pivot to sharper alternative.' },
    { title: 'Build product 5–10 pages — one transformation', detail: 'PDF / template pack / mini-course. Use Manus or Z.ai Agent for designed PDF.' },
    { title: 'Pick ONE storefront and verify payout TODAY', detail: 'Gumroad (fastest) / Lemon Squeezy (tax handled) / Whop (discovery). Test $1 purchase.' },
    { title: 'Write landing page copy (5 parts)', detail: 'Headline <10w + 3 verb bullets + what’s inside + price line + guarantee.' },
    { title: 'Create 3 faceless scripts (3 hook styles)', detail: 'Problem / Curiosity / Result hooks. Same product + CTA, vary wording.' },
    { title: 'Record 3 promo pieces 1080×1920 with captions', detail: 'Screen+voice or text+b-roll. VN or CapCut, 9:16, auto-captions on.' },
    { title: 'Post piece 1, schedule 2–3, cross-post Reels/Shorts', detail: 'Reply to every comment in first hour — algorithm window.' },
    { title: 'Run Playbook C batch: 7 scripts → 5h filming → 7 posts', detail: 'Use batch prompt in Z.ai/Manus. Check Daily Tracker daily.' },
    { title: 'Double down on winning hook after 3 posts', detail: 'Don’t invent new angles — make 2 more like winner.' },
    { title: 'Collect first sale → screenshot → double winning format', detail: 'First sale 19–24d. Then open Scale playbook.' }
  ],
  'track-b': [
    { title: 'Pick ONE service (not three)', detail: 'Content calendars / Copywriting / Simple automation. One positioning line.' },
    { title: 'Write positioning line (specific business + result + timeframe)', detail: 'I help [type] get [result] without [pain] — using AI, in [time].' },
    { title: 'Build prospect list 40–50 (signaled, not random)', detail: 'IG/FB no posts 2w / Maps 3-stars no site / FB Groups ask / LinkedIn overwhelm.' },
    { title: 'Set up tracking sheet + Z.ai/Manus prospect research', detail: 'Log Prospect | Platform | Signal | Touch dates. Use Z.ai Agent to generate 40.' },
    { title: 'Write 25 personalized DMs (first line = signal)', detail: 'IG/FB, LinkedIn, Group templates. First line proves you looked.' },
    { title: 'Send first 25 (Day 3) — 5-min gaps, not blast', detail: 'Volume is lever: 25 sent → 3–5 replies → 1–2 calls.' },
    { title: 'Send remaining 25 (Day 4) + answer every reply <24h', detail: 'Speed is proof: reply today, not tomorrow.' },
    { title: 'Run 3-step follow-up (Day 5, 72h gaps, stop at 3)', detail: 'Not a no until 3 touches. Then mark dormant.' },
    { title: 'Handle replies → tailored sample → book calls → close', detail: 'Rehearse objection + closing script + 50% deposit ask.' },
    { title: 'Deliver fast, over-deliver, ask testimonial within 24h', detail: 'First client 7–11d. Testimonial makes client 2 easier.' }
  ]
};

function getUserId(context){
  const c = context.request.headers.get('Cookie') || '';
  const m = c.match(/__session=([^;]+)/);
  if(!m) return null;
  return context.env.SESSIONS.get('sess:' + m[1]);
}

export async function onRequestGet(context){
  const userId = await getUserId(context);
  if(!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const url = new URL(context.request.url);
  const track = url.searchParams.get('track') || null;
  const DB = context.env.DB;
  // If no tasks yet, generate default
  let rows = await DB.prepare(`SELECT * FROM checklist_tasks WHERE user_id = ? ${track? 'AND track = ?' : ''} ORDER BY sort_order`).bind(userId, ...(track?[track]:[])).all();
  if(!rows.results.length){
    const genTrack = track || '30-day-blueprint';
    const templates = TRACK_TEMPLATES[genTrack] || TRACK_TEMPLATES['30-day-blueprint'];
    for(let i=0;i<templates.length;i++){
      const t = templates[i];
      const id = crypto.randomUUID();
      await DB.prepare(`INSERT INTO checklist_tasks (id, user_id, track, title, detail, sort_order, done, note, is_custom) VALUES (?, ?, ?, ?, ?, ?, 0, '', 0)`).bind(id, userId, genTrack, t.title, t.detail, i).run();
    }
    rows = await DB.prepare(`SELECT * FROM checklist_tasks WHERE user_id = ? AND track = ? ORDER BY sort_order`).bind(userId, genTrack).all();
  }
  return new Response(JSON.stringify({ tasks: rows.results }), { headers: { 'Content-Type':'application/json' } });
}

export async function onRequestPost(context){
  const userId = await getUserId(context);
  if(!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  let body;
  try{ body = await context.request.json(); }catch{ return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });}
  const DB = context.env.DB;
  if(body.action === 'toggle' && body.id){
    const done = body.done ? 1 : 0;
    await DB.prepare(`UPDATE checklist_tasks SET done = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).bind(done, body.id, userId).run();
    return new Response(JSON.stringify({ ok: true }));
  }
  if(body.action === 'note' && body.id){
    await DB.prepare(`UPDATE checklist_tasks SET note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).bind(body.note || '', body.id, userId).run();
    return new Response(JSON.stringify({ ok: true }));
  }
  if(body.action === 'add' && body.title){
    const id = crypto.randomUUID();
    const track = body.track || '30-day-blueprint';
    const cnt = await DB.prepare(`SELECT COUNT(*) as c FROM checklist_tasks WHERE user_id = ? AND track = ?`).bind(userId, track).first();
    const order = cnt ? cnt.c : 0;
    await DB.prepare(`INSERT INTO checklist_tasks (id, user_id, track, title, detail, sort_order, done, note, is_custom) VALUES (?, ?, ?, ?, ?, ?, 0, '', 1)`).bind(id, userId, track, body.title, body.detail || '', order).run();
    return new Response(JSON.stringify({ ok: true, id }));
  }
  if(body.action === 'delete' && body.id){
    // only removable if is_custom = 1
    const row = await DB.prepare(`SELECT is_custom FROM checklist_tasks WHERE id = ? AND user_id = ?`).bind(body.id, userId).first();
    if(!row || !row.is_custom) return new Response(JSON.stringify({ error: 'Cannot delete default task' }), { status: 403 });
    await DB.prepare(`DELETE FROM checklist_tasks WHERE id = ? AND user_id = ?`).bind(body.id, userId).run();
    return new Response(JSON.stringify({ ok: true }));
  }
  if(body.action === 'generate' && body.track){
    const track = body.track;
    const templates = TRACK_TEMPLATES[track];
    if(!templates) return new Response(JSON.stringify({ error: 'Unknown track' }), { status: 400 });
    await DB.prepare(`DELETE FROM checklist_tasks WHERE user_id = ? AND track = ?`).bind(userId, track).run();
    for(let i=0;i<templates.length;i++){
      const t = templates[i];
      const id = crypto.randomUUID();
      await DB.prepare(`INSERT INTO checklist_tasks (id, user_id, track, title, detail, sort_order, done, note, is_custom) VALUES (?, ?, ?, ?, ?, ?, 0, '', 0)`).bind(id, userId, track, t.title, t.detail, i).run();
    }
    const rows = await DB.prepare(`SELECT * FROM checklist_tasks WHERE user_id = ? AND track = ? ORDER BY sort_order`).bind(userId, track).all();
    return new Response(JSON.stringify({ tasks: rows.results }), { headers: { 'Content-Type':'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
}

export async function onRequest(context){
  if(context.request.method === 'GET') return onRequestGet(context);
  if(context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
