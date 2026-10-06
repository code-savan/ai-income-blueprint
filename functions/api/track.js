const TRACKS=['service','product'];
export const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function getUser(context){const m=(context.request.headers.get('Cookie')||'').match(/__session=([^;]+)/);if(!m)return null;const id=await context.env.SESSIONS.get('sess:'+m[1]);if(!id)return null;const found=await context.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();return found?id:null;}
export async function readTrack(DB,id){const rows=await DB.prepare("SELECT module, done FROM progress WHERE user_id = ? AND module IN ('selected-track-service','selected-track-product')").bind(id).all();const active=rows.results.find(x=>x.done);return active?active.module.replace('selected-track-',''):null;}
export async function onRequestGet(context){const id=await getUser(context);if(!id)return json({error:'Unauthorized'},401);return json({track:await readTrack(context.env.DB,id)});}
export async function onRequestPost(context){
 const id=await getUser(context);if(!id)return json({error:'Unauthorized'},401);let body;try{body=await context.request.json();}catch{return json({error:'Invalid JSON'},400);}
 if(!TRACKS.includes(body.track))return json({error:'Choose service or product'},400);
 const DB=context.env.DB,current=await readTrack(DB,id);
 const reset=body.reset===true && body.confirm==='CLEAR_MY_WORK';
 if(body.reset && !reset)return json({error:'Confirm that your saved work will be cleared'},400);
 if(current && body.track!==current && !reset)return json({error:'Changing your track requires a confirmed reset'},409);
 if(reset && body.expectedTrack!==current)return json({error:'Your track changed in another tab. Reload before resetting.'},409);
 const queries=[];
 if(reset){
  // One transaction, one member. Keep the account, access and login sessions.
  queries.push(DB.prepare('DELETE FROM sheet_rows WHERE sheet_id IN (SELECT id FROM sheets WHERE user_id = ?)').bind(id));
  queries.push(DB.prepare('DELETE FROM sheet_settings WHERE user_id = ?').bind(id));
  queries.push(DB.prepare('DELETE FROM sheets WHERE user_id = ?').bind(id));
  queries.push(DB.prepare('DELETE FROM checklist_tasks WHERE user_id = ?').bind(id));
  queries.push(DB.prepare('DELETE FROM progress WHERE user_id = ?').bind(id));
 }
 queries.push(...TRACKS.map(track=>DB.prepare('INSERT INTO progress (user_id, module, done) VALUES (?, ?, ?) ON CONFLICT(user_id, module) DO UPDATE SET done=excluded.done, updated_at=CURRENT_TIMESTAMP').bind(id,'selected-track-'+track,Number(track===body.track))));
 await DB.batch(queries);return json({ok:true,track:body.track,reset});
}
export async function onRequest(context){if(context.request.method==='GET')return onRequestGet(context);if(context.request.method==='POST')return onRequestPost(context);return json({error:'Method not allowed'},405);}
