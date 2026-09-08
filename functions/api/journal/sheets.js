const SHEET_DEFS = {
  outreach: {
    title: 'Outreach Tracker',
    columns: ['Prospect','Platform','Signal Noticed','Touch 1','Touch 2','Touch 3','Replied?','Called?','Closed?','Revenue','Notes'],
    defaults: 50,
    dropdowns: {
      'Platform': ['Instagram','Facebook','Google Maps','LinkedIn','Facebook Groups','Twitter','TikTok','Email'],
      'Signal Noticed': ['No posts 3 weeks','3.2 stars / no website','Group ask — need help','Overwhelm language','No website link','Last post 2 weeks ago','No engagement'],
      'Replied?': ['No','Yes','Pending'],
      'Called?': ['No','Yes','Scheduled'],
      'Closed?': ['No','Yes','Follow-up']
    },
    prefill: (i) => ({
      'Prospect': `Prospect ${i+1}`,
      'Platform': 'Instagram',
      'Signal Noticed': 'No posts 3 weeks',
      'Touch 1': '',
      'Touch 2': '',
      'Touch 3': '',
      'Replied?': 'No',
      'Called?': 'No',
      'Closed?': 'No',
      'Revenue': '',
      'Notes': ''
    })
  },
  weekly: {
    title: 'Weekly Scorecard',
    columns: ['Week','Income','Leads','Closed','Content','Hours','Focus Next Week','Blockers'],
    defaults: 12,
    dropdowns: {},
    prefill: (i) => ({
      'Week': `W${i+1}`,
      'Income': '0',
      'Leads': '0',
      'Closed': '0',
      'Content': '0',
      'Hours': '0',
      'Focus Next Week': '',
      'Blockers': ''
    })
  },
  daily: {
    title: 'Daily Content Tracker',
    columns: ['Date','Hook Type','Script Title','Views','CTR%','Clicks','Sales','Notes'],
    defaults: 50,
    dropdowns: {
      'Hook Type': ['Problem','Curiosity','Result']
    },
    prefill: (i) => {
      const d = new Date('2026-09-01'); d.setDate(d.getDate()+i);
      const iso = d.toISOString().slice(0,10);
      const hooks = ['Problem','Curiosity','Result'];
      return {
        'Date': iso,
        'Hook Type': hooks[i%3],
        'Script Title': '',
        'Views': '0',
        'CTR%': '0',
        'Clicks': '0',
        'Sales': '0',
        'Notes': ''
      };
    }
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
  for(let i=0;i<def.defaults;i++){
    const rowId = crypto.randomUUID();
    const data = def.prefill ? def.prefill(i) : {};
    // ensure all columns present
    def.columns.forEach(col=> { if(!(col in data)) data[col] = ''; });
    await DB.prepare(`INSERT INTO sheet_rows (id, sheet_id, row_idx, data) VALUES (?, ?, ?, ?)`).bind(rowId, id, i, JSON.stringify(data)).run();
  }
  // init settings with default order/widths
  const order = JSON.stringify(def.columns);
  const widths = JSON.stringify(Object.fromEntries(def.columns.map(c=>[c, '']))); // empty = auto
  await DB.prepare(`INSERT OR IGNORE INTO sheet_settings (id, user_id, sheet_type, column_order, column_widths) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), userId, type, order, widths).run();
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
  const settings = await DB.prepare(`SELECT column_order, column_widths FROM sheet_settings WHERE user_id = ? AND sheet_type = ?`).bind(userId, type).first();
  let columns = def.columns;
  let widths = {};
  let dropdowns = def.dropdowns || {};
  if(settings){
    try{ if(settings.column_order) columns = JSON.parse(settings.column_order); }catch{}
    try{ if(settings.column_widths) widths = JSON.parse(settings.column_widths); }catch{}
  }
  return new Response(JSON.stringify({ sheet_type: type, title: def.title, columns, widths, dropdowns, rows: data }), { headers: { 'Content-Type':'application/json' } });
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
    const data = def.prefill ? def.prefill(idx) : {};
    def.columns.forEach(col=> { if(!(col in data)) data[col] = ''; });
    // for add-row, keep prospect/week etc sequential but Notes empty
    if(type==='outreach') data['Prospect'] = `Prospect ${idx+1}`;
    if(type==='weekly') data['Week'] = `W${idx+1}`;
    if(type==='daily'){
      const d = new Date('2026-09-01'); d.setDate(d.getDate()+idx);
      data['Date'] = d.toISOString().slice(0,10);
      data['Hook Type'] = ['Problem','Curiosity','Result'][idx%3];
    }
    const rowId = crypto.randomUUID();
    await DB.prepare(`INSERT INTO sheet_rows (id, sheet_id, row_idx, data) VALUES (?, ?, ?, ?)`).bind(rowId, sheetId, idx, JSON.stringify(data)).run();
    return new Response(JSON.stringify({ ok: true, row_idx: idx }));
  }
  if(body.action === 'reorder-columns' && Array.isArray(body.columns)){
    const order = JSON.stringify(body.columns);
    await DB.prepare(`INSERT INTO sheet_settings (id, user_id, sheet_type, column_order, column_widths) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, sheet_type) DO UPDATE SET column_order = excluded.column_order, updated_at = CURRENT_TIMESTAMP`).bind(crypto.randomUUID(), userId, type, order, JSON.stringify({})).run();
    // preserve widths
    const existing = await DB.prepare(`SELECT column_widths FROM sheet_settings WHERE user_id = ? AND sheet_type = ?`).bind(userId, type).first();
    if(existing && existing.column_widths){
      await DB.prepare(`UPDATE sheet_settings SET column_order = ? WHERE user_id = ? AND sheet_type = ?`).bind(order, userId, type).run();
    }
    return new Response(JSON.stringify({ ok: true }));
  }
  if(body.action === 'resize-column' && body.column && typeof body.width === 'string'){
    let widths = {};
    const cur = await DB.prepare(`SELECT column_widths FROM sheet_settings WHERE user_id = ? AND sheet_type = ?`).bind(userId, type).first();
    if(cur && cur.column_widths) try{ widths = JSON.parse(cur.column_widths); }catch{}
    widths[body.column] = body.width;
    const orderRow = await DB.prepare(`SELECT column_order FROM sheet_settings WHERE user_id = ? AND sheet_type = ?`).bind(userId, type).first();
    const order = orderRow ? orderRow.column_order : JSON.stringify(def.columns);
    await DB.prepare(`INSERT INTO sheet_settings (id, user_id, sheet_type, column_order, column_widths) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, sheet_type) DO UPDATE SET column_widths = excluded.column_widths, updated_at = CURRENT_TIMESTAMP`).bind(crypto.randomUUID(), userId, type, order, JSON.stringify(widths)).run();
    return new Response(JSON.stringify({ ok: true }));
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
