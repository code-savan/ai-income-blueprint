import {getUser,json,readTrack} from './track.js';
const CHOICES={service:['website','copy','design','video','social','listings','emails','slides','research','workflow','custom'],product:['project-kit','job-tracker','content-planner','media-kit','budget-sheet','event-planner','study-planner','craft-affiliate','bedding-affiliate','phone-affiliate','custom']};
export async function onRequest(context){
 const id=await getUser(context);if(!id)return json({error:'Unauthorized'},401);
 const track=await readTrack(context.env.DB,id);if(!track)return json({error:'Choose your track first'},409);
 if(context.request.method==='GET'){
  const rows=await context.env.DB.prepare('SELECT module FROM progress WHERE user_id = ? AND module LIKE ? AND done = 1').bind(id,`selected-choice-${track}-%`).all();
  return json({track,choice:rows.results[0]?.module.replace(`selected-choice-${track}-`,'')||null});
 }
 if(context.request.method!=='POST')return json({error:'Method not allowed'},405);
 let body;try{body=await context.request.json();}catch{return json({error:'Invalid JSON'},400);}
 if(body.track!==track)return json({error:'Your track changed. Reload this page.'},409);
 if(!CHOICES[track].includes(body.choice))return json({error:'Choose an offer from this route'},400);
 await context.env.DB.batch([
  context.env.DB.prepare('DELETE FROM progress WHERE user_id = ? AND module LIKE ?').bind(id,'selected-choice-%'),
  context.env.DB.prepare('INSERT INTO progress (user_id,module,done) VALUES (?,?,1)').bind(id,`selected-choice-${track}-${body.choice}`)
 ]);
 return json({ok:true,track,choice:body.choice});
}
