// Track A remains products and Track B remains services for existing accounts.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const TRACK_TEMPLATES = {
 '30-day-blueprint': [
 ['Select a route you can execute','Run the diagnostic. Your route saves to your account. No income deadline is predicted.'],
 ['Set up the free delivery stack','Use one writing tool, one editor, and one delivery method. Check current tools and payout eligibility.'],
 ['Finish the filled practice walkthrough','F. Choose your service and finish its practice sample. B. Choose your product and make a complete first version.'],
 ['Define the offer and its scope','A. Name the exact files, facts needed, work excluded, deadline, revision limit and price. No guaranteed business results.'],
 ['Use the action prompt pack','Replace brackets in the relevant prompts. Check every factual claim before using the output.'],
 ['Create a demonstration and working next step','C. Record the actual workflow. E. Turn it into a useful carousel. I. Test sample delivery.'],
 ['Inspect actual results and economics','D. Track collected revenue, costs, effort and feedback. Demonstrations are not student earnings evidence.'],
 ['Save and review the operating sheets','Keep researched observations, follow-up permission, content actions and actual results in your trackers.']
 ],
 'track-a': [
 ['Gather evidence for one product problem','B. Talk to potential buyers. An AI score is not validation. Log repeated questions and existing alternatives.'],
 ['Build one complete reusable product','B. Use the filled Freelancer Project Starter as a reference: instructions, example, worksheet and QA.'],
 ['Choose delivery and verify payout access','B. Check account/location requirements, fees, review conditions and delivery in test mode.'],
 ['Write a truthful product page','B. Show preview, specific contents, compatibility, price, support and actual refund terms.'],
 ['Create three demonstration scripts','C. Show the product solving a small real task. Use factual hooks rather than earnings promises.'],
 ['Record and edit three promo pieces','C. Use own screen/voice or licensed footage. Free captions can be manual. Preview on a phone.'],
 ['Publish and answer relevant questions','I. Deliver the promised preview. Ask which problem the interested person is working on.'],
 ['Finish a seven-video batch or carousel','C. Complete the batch script. E. Teach one decision with a filled example.'],
 ['Review buyer actions and improve one variable','I. Track qualified replies, clicks and purchases separately. Compare more than one post.'],
 ['Review sales, fees, delivery and feedback','D. Only collected orders count as sales. Use actual results to choose the next improvement.']
 ],
 'track-b': [
 ['Make a small sample of your selected service','F. Open your chosen service example and use the exact making steps. Check the practice output before offering paid work.'],
 ['Write a scoped offer sentence','A. Name buyer, deliverables, inputs, turnaround and exclusions. Sell defined work, not guaranteed business results.'],
 ['Research ten suitable prospects','A. Choose Instagram, Facebook Groups, LinkedIn, Maps/websites or permitted marketplace requests. Follow the channel instructions and check every source.'],
 ['Set up the outreach tracker','A. Add source links and observations. AI can organize supplied facts; it must not invent contacts or buying interest.'],
 ['Write five personalized permission messages','A. Use one relevant observation. Offer to share a small sample. Keep messages manual and specific.'],
 ['Send the first small batch and log replies','A. Follow platform rules. No fixed message-to-client conversion ratio is promised.'],
 ['Review replies before the next batch','A. Improve fit or clarity from actual feedback. Do not treat silence as permission to send repeated messages.'],
 ['Follow up only where appropriate','I. Deliver resources first. Use an agreed or relevant follow-up, then stop after refusal or a final unanswered check.'],
 ['Agree scope, payment and delivery','A. Confirm deliverables, inputs, price, milestones and revisions in writing. A verbal yes is not collected revenue.'],
 ['Deliver, request approval and review','F. Check the files, send simple use instructions and request approval. Ask permission before sharing the work. D. Review actual time and costs.']
 ]
};
const AFFILIATE_TASKS=[
 ['Check program and payout eligibility','J. Verify your country, account and payment method against official rules before buying a sample.'],
 ['Compare three actual products','J. Use your chosen niche. Check fit, seller, recent reviews, shipping, returns, commission and sample cost.'],
 ['Inspect one real sample','J. Check contents, dimensions, compatibility and the use you will show. Do not invent a review.'],
 ['Plan a factual demonstration','C. Show the real result, how it works and one limitation. Use the timed shot recipe.'],
 ['Record and edit one useful demo','C. Use real footage, checked captions and a clear affiliate disclosure.'],
 ['Check the approved product link','J. The linked item must match the inspected sample and your permitted program.'],
 ['Publish and answer fit questions','I. Use verified facts. Say when the product does not fit the person’s needs.'],
 ['Make a useful carousel or next demo','E. Teach one use or fit check. Do not promise health, safety or income results.'],
 ['Log orders, returns and commission','J. Keep pending, approved and available commission separate. Check actual payout terms.'],
 ['Review actual costs and buyer questions','D. Include sample cost, fees and hours. Use real responses to decide the next small test.']
];
async function syncTemplates(DB,userId,track){
 const queries=[];
 const choice=await DB.prepare("SELECT module FROM progress WHERE user_id = ? AND done = 1 AND module LIKE 'selected-choice-product-%'").bind(userId).all();
 const affiliate=choice.results.some(r=>r.module.endsWith('-affiliate'));
 const templates=track==='track-a'&&affiliate?AFFILIATE_TASKS:TRACK_TEMPLATES[track];
 for(const [i,[title,detail]] of templates.entries()){
  // Update only guide text. Never reset done/note, remove custom rows, or change existing IDs.
  queries.push(DB.prepare('UPDATE checklist_tasks SET title = ?, detail = ? WHERE user_id = ? AND track = ? AND sort_order = ? AND is_custom = 0').bind(title,detail,userId,track,i));
  // Stable ID plus NOT EXISTS prevents duplicate defaults on repeated/concurrent refreshes.
  queries.push(DB.prepare("INSERT OR IGNORE INTO checklist_tasks (id,user_id,track,title,detail,sort_order,done,note,is_custom) SELECT ?,?,?,?,?,?,0,'',0 WHERE NOT EXISTS (SELECT 1 FROM checklist_tasks WHERE user_id = ? AND track = ? AND sort_order = ? AND is_custom = 0)").bind(`guide-v2:${userId}:${track}:${i}`,userId,track,title,detail,i,userId,track,i));
 }
 await DB.batch(queries);
}
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
  const track = url.searchParams.get('track') || '30-day-blueprint';
  if(!TRACK_TEMPLATES[track]) return json({error:'Unknown track'},400);
  const DB = context.env.DB;
  await syncTemplates(DB, userId, track);
  const rows = await DB.prepare(`SELECT * FROM checklist_tasks WHERE user_id = ? AND track = ? ORDER BY sort_order, is_custom, id`).bind(userId,track).all();
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
    await DB.prepare(`UPDATE checklist_tasks SET note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).bind(String(body.note || '').slice(0,5000), body.id, userId).run();
    return new Response(JSON.stringify({ ok: true }));
  }
  if(body.action === 'add' && body.title){
    const id = crypto.randomUUID();
    const track = body.track || '30-day-blueprint';
    if(!TRACK_TEMPLATES[track]) return json({error:'Unknown track'},400);
    if(typeof body.title!=='string'||!body.title.trim()||body.title.length>160) return json({error:'Task title must be 1–160 characters'},400);
    const cnt = await DB.prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 as c FROM checklist_tasks WHERE user_id = ? AND track = ?`).bind(userId, track).first();
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
    await syncTemplates(DB, userId, track);
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
