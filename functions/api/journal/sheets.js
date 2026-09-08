const SHEET_DEFS = {
  outreach: {
    title: 'Outreach Tracker',
    columns: ['Prospect','Platform','Signal Noticed','Touch 1','Touch 2','Touch 3','Replied?','Called?','Closed?','Revenue','Notes'],
    defaults: 50
  },
  weekly: {
    title: 'Weekly Scorecard',
    columns: ['Week','Income','Leads','Closed','Content','Hours','Focus Next Week','Blockers'],
    defaults: 12
  },
  daily: {
    title: 'Daily Content Tracker',
    columns: ['Date','Hook Type','Script Title','Views','CTR%','Clicks','Sales','Notes'],
    defaults: 50
  }
};

function getUserId(context){
  const c = context.request.headers.get('Cookie') || '';
  const m = c.match(/__session=([^;]+)/);
  if(!m) return null;
  return context.env.SESSIONS.get('sess:' + m[1]);
}

async function ensureSheet(DB, userId, type){
  const def = SHEET_DEFS[type];
  if(!def) return null;
  let sheet = await DB.prepare(`SELECT id FROM sheets WHERE user_id = ? AND sheet_type = ?`).bind(userId, type).first();
  if(sheet) return sheet.id;
  const id = crypto.randomUUID();
  await DB.prepare(`INSERT INTO sheets (id, user_id, sheet_type, title) VALUES (?, ?, ?, ?)`).bind(id, userId, type, def.title).run();
  // create default rows
  for(let i=0;i<def.defaults;i++){
    const rowId = crypto.randomUUID();
    const empty = {};
    def.columns.forEach(col=> empty[col] = '');
    // add example in first row
    if(i===0 && type==='outreach'){ empty['Prospect']='Example Cafe'; empty['Platform']='Instagram'; empty['Signal Noticed']='No posts 3 weeks'; empty['Notes']='Personalize first line'; }
    if(i===0 && type==='weekly'){ empty['Week']='W1'; empty['Income']='0'; }
    if(i===0 && type==='daily'){ empty['Date']='2026-09-01'; empty['Hook Type']='Problem'; }
    await DB.prepare(`INSERT INTO sheet_rows (id, sheet_id, row_idx, data) VALUES (?, ?, ?, ?)`).bind(rowId, id, i, JSON.stringify(empty)).run();
  }
  return id;
}

export async function onRequestGet(context){
  const userId = await getUserId(context);
  if(!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const url = new URL(context.request.url);
  const type = url.searchParams.get('type') || 'outreach';
  const def = SHEET_DEFS[type];
  if(!def) return new Response(JSON.stringify({ error: 'Unknown sheet type' }), { status: 400 });
  const DB = context.env.DB;
  const sheetId = await ensureSheet(DB, userId, type);
  const rows = await DB.prepare(`SELECT row_idx, data FROM sheet_rows WHERE sheet_id = ? ORDER BY row_idx`).bind(sheetId).all();
  const data = rows.results.map(r=> ({ row_idx: r.row_idx, ...JSON.parse(r.data) }));
  return new Response(JSON.stringify({ sheet_type: type, title: def.title, columns: def.columns, rows: data }), { headers: { 'Content-Type':'application/json' } });
}

export async function onRequestPost(context){
  const userId = await getUserId(context);
  if(!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  let body;
  try{ body = await context.request.json(); }catch{ return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const type = body.type || body.sheet_type;
  const def = SHEET_DEFS[type];
  if(!def) return new Response(JSON.stringify({ error: 'Unknown sheet type' }), { status: 400 });
  const DB = context.env.DB;
  const sheetId = await ensureSheet(DB, userId, type);

  if(body.action === 'add-row'){
    const cnt = await DB.prepare(`SELECT COUNT(*) as c FROM sheet_rows WHERE sheet_id = ?`).bind(sheetId).first();
    const idx = cnt ? cnt.c : 0;
    const empty = {};
    def.columns.forEach(col=> empty[col] = '');
    const rowId = crypto.randomUUID();
    await DB.prepare(`INSERT INTO sheet_rows (id, sheet_id, row_idx, data) VALUES (?, ?, ?, ?)`).bind(rowId, sheetId, idx, JSON.stringify(empty)).run();
    return new Response(JSON.stringify({ ok: true, row_idx: idx }));
  }

  if(typeof body.row_idx === 'number' && body.data){
    // upsert row
    const idx = body.row_idx;
    const existing = await DB.prepare(`SELECT id FROM sheet_rows WHERE sheet_id = ? AND row_idx = ?`).bind(sheetId, idx).first();
    const dataStr = JSON.stringify(body.data);
    if(existing){
      await DB.prepare(`UPDATE sheet_rows SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE sheet_id = ? AND row_idx = ?`).bind(dataStr, sheetId, idx).run();
    } else {
      const rowId = crypto.randomUUID();
      await DB.prepare(`INSERT INTO sheet_rows (id, sheet_id, row_idx, data) VALUES (?, ?, ?, ?)`).bind(rowId, sheetId, idx, dataStr).run();
    }
    return new Response(JSON.stringify({ ok: true }));
  }

  return new Response(JSON.stringify({ error: 'Missing row_idx or data' }), { status: 400 });
}

export async function onRequest(context){
  if(context.request.method === 'GET') return onRequestGet(context);
  if(context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405 });
}
