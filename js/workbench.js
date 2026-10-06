import {ROUTES,BOOK_PATHS,diagnose,capacity,csvText} from './logic.js?v=20261006-sidebar';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
async function api(path,body){
 const init={credentials:'include'};if(body!==undefined){init.method='POST';init.headers={'Content-Type':'application/json'};init.body=JSON.stringify(body);}
 const r=await fetch(path,init);if(r.status===401){location.href='/login.html';throw Error('Your session expired. Sign in again.');}
 if(!r.ok){let reason;try{reason=(await r.json()).error;}catch{}throw Error(reason||`Could not save (${r.status}). Try again.`);}return r.json();
}
function status(el,msg){if(el)el.textContent=msg;}
function download(name,text,type='text/plain'){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
const ROUTE_BOOKS = {service:['F','G','H','A','E','C','I','D'],product:['B','J','C','E','I','D']};
function applyTrack(track){
 const r=ROUTES[track];
 $$('[data-start-new]').forEach(el=>el.hidden=!!r);
 $$('[data-start-saved]').forEach(el=>el.hidden=!r);
 $$('[data-no-track]').forEach(el=>el.hidden=!!r);
 $$('[data-journey]').forEach(el=>el.hidden=!r);
 if(!r){status($('[data-track-status]'),'');return;}
 $$('[data-route-heading]').forEach(el=>el.textContent=track==='service'?'Build your service route.':'Build your product route.');
 $$('[data-route-description]').forEach(el=>el.textContent=r.action);
 $$('[data-sidebar-track]').forEach(el=>el.textContent='SELECTED / '+(track==='service'?'SERVICES':'PRODUCTS'));
 $$('[data-route-map]').forEach(el=>el.hidden=el.dataset.routeMap!==track);
 const filter=$('#book-filter');if(filter){filter.value=track;filterBooks(track);}
 const related=$('[data-related-books]');if(related){related.replaceChildren();for(const letter of ROUTE_BOOKS[track]){const p=document.createElement('p'),a=document.createElement('a');a.href=BOOK_PATHS[letter];a.textContent='Playbook '+letter+' / '+BOOK_TITLES[letter];p.append(a);related.append(p);}}
 if($('#task-track')){$('#task-track').value=r.list;loadTasks();}
 status($('[data-track-status]'),'');
}
const BOOK_TITLES={A:'Find and pitch your first client',B:'Build a useful digital product',C:'Faceless demonstration videos',D:'Repeatable delivery and economics',E:'Carousels with a useful result',F:'Complete content-service delivery',G:'Focused copywriting project',H:'Product video creative',I:'Sample-to-sale follow-up',J:'Eligible affiliate demonstrations'};
async function saveTrack(track){if(!ROUTES[track])return;await api('/api/track',{track});return ROUTES[track];}
if($('[data-sidebar-track]')) api('/api/track').then(d=>applyTrack(d.track)).catch(e=>{
 status($('[data-track-status]'),e.message);
 const start=$('[data-start-new]');if(start)start.hidden=false;
 const empty=$('[data-no-track]');if(empty)empty.hidden=false;
});
const quiz=$('#track-quiz');let questionIndex=0;
function showQuestion(){
 $$('[data-question]').forEach((el,i)=>{el.hidden=i!==questionIndex;el.disabled=i!==questionIndex;});
 status($('#quiz-position'),`QUESTION ${String(questionIndex+1).padStart(2,'0')} / 06`);
 $('#quiz-progress').value=questionIndex+1;$('#quiz-back').disabled=questionIndex===0;
 $('#quiz-next').disabled=!quiz.querySelector(`[name="q${questionIndex}"]:checked`);
 $('#quiz-next').textContent=questionIndex===5?'Get and save my track →':'Next question →';
}
function quizResult(track){
 const r=ROUTES[track],panel=$('#quiz-result');panel.hidden=false;panel.replaceChildren();
 quiz.hidden=true;$('.quiz-progress').hidden=true;
 const k=document.createElement('span');k.className='eyebrow';k.textContent='Your starting point / saved';
 const h=document.createElement('h2');h.textContent=track==='service'?'Start with a service.':'Start with a reusable product.';
 const p=document.createElement('p');p.textContent=r.action;
 const a=document.createElement('a');a.className='button';a.href='/checklist.html';a.textContent='Show my next steps ↗';
 panel.append(k,h,p,a);
}
async function saveQuiz(track){
 try{status($('#quiz-status'),'Saving your track…');await saveTrack(track);quizResult(track);status($('#quiz-status'),'Saved. Your existing work stays in your account.');}
 catch(e){status($('#quiz-status'),e.message);}
}
async function advanceQuiz(){
 if(!quiz.querySelector(`[name="q${questionIndex}"]:checked`))return;
 if(questionIndex<5){questionIndex++;showQuestion();quiz.querySelector('fieldset:not([hidden]) legend').setAttribute('tabindex','-1');quiz.querySelector('fieldset:not([hidden]) legend').focus();return;}
 // Read all six answers, including preserved answers from inactive fieldsets.
 const values=$$('input[type="radio"]:checked').map(el=>el.value),track=diagnose(values),next=$('#quiz-next');next.disabled=true;
 if(track){await saveQuiz(track);next.disabled=false;}
 else{quiz.hidden=true;$('.quiz-progress').hidden=true;const panel=$('#quiz-result');panel.hidden=false;panel.replaceChildren();const h=document.createElement('h2');h.textContent='Both routes fit. Pick your first output.';const p=document.createElement('p');p.textContent='Choose the work you can finish and test. You can revisit the track later.';panel.append(h,p);for(const t of ['service','product']){const b=document.createElement('button');b.textContent=t==='service'?'A scoped service sample':'A reusable product';b.addEventListener('click',async()=>{panel.querySelectorAll('button').forEach(x=>x.disabled=true);await saveQuiz(t);panel.querySelectorAll('button').forEach(x=>x.disabled=false);});panel.append(b);}}
}
if(quiz){showQuestion();quiz.addEventListener('change',showQuestion);$('#quiz-next').addEventListener('click',advanceQuiz);$('#quiz-back').addEventListener('click',()=>{questionIndex--;showQuestion();});quiz.addEventListener('submit',e=>{e.preventDefault();advanceQuiz();});}
// Keep one playbook chapter in view. Hash links and browser Back restore the reader.
const reader=$('[data-reader]'),readerSections=$$('[data-reader-section]');let readerIndex=0;
function renderReader(){
 if(!reader)return;
 const target=location.hash.slice(1),found=readerSections.findIndex(el=>el.id===target);readerIndex=found<0?0:found;
 readerSections.forEach((el,i)=>el.hidden=i!==readerIndex);
 $$('[data-reader-link]').forEach(a=>{if(a.hash==='#'+readerSections[readerIndex].id)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 const current=readerSections[readerIndex],step=current.id.match(/^step-(\d+)$/);
 status($('#reader-position'),step?`STEP ${String(step[1]).padStart(2,'0')} / ${$$('[data-progress]').length}`:current.id==='route'?'START / TOOL ROUTE':current.id==='example'?'FINISHED EXAMPLE':'WHAT’S NEXT');
 $('#reader-back').disabled=readerIndex===0;$('#reader-next').disabled=readerIndex===readerSections.length-1;
 $('#reader-next').textContent=readerIndex===0?'Start step 01 →':readerSections[readerIndex+1]?.id==='example'?'Inspect the example →':readerSections[readerIndex+1]?.id==='next'?'What’s next →':readerIndex===readerSections.length-1?'Sequence finished':'Next step →';
}
function goReader(index){const section=readerSections[index];if(!section)return;location.hash=section.id;}
if(reader){renderReader();window.addEventListener('hashchange',()=>{renderReader();reader.scrollIntoView({block:'start',behavior:'smooth'});});$('#reader-back').addEventListener('click',()=>goReader(readerIndex-1));$('#reader-next').addEventListener('click',()=>goReader(readerIndex+1));}
$('#example-select')?.addEventListener('change',e=>$$('[data-example]').forEach(el=>el.hidden=el.dataset.example!==e.target.value));
$$('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
document.addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(b){const text=b.closest('.prompt').querySelector('pre').textContent;try{await navigator.clipboard.writeText(text);b.textContent='Copied';setTimeout(()=>b.textContent='Copy prompt',1600);}catch{const range=document.createRange();range.selectNodeContents(b.closest('.prompt').querySelector('pre'));const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);b.textContent='Selected: copy with your keyboard';}}
 const route=e.target.closest('[data-route]');if(route){$$('[data-route]').forEach(x=>x.setAttribute('aria-pressed',String(x===route)));$$('[data-route-content]').forEach(x=>x.hidden=x.dataset.routeContent!==route.dataset.route);}
});
function filterPrompts(){const q=($('#prompt-search')?.value||'').toLowerCase(),cat=$('#prompt-filter')?.value||'all';let count=0;$$('[data-prompt-item]').forEach(x=>{x.hidden=!((cat==='all'||cat===x.dataset.category)&&x.textContent.toLowerCase().includes(q));if(!x.hidden)count++;});status($('#prompt-count'),count+' prompts shown');if($('#prompt-empty'))$('#prompt-empty').hidden=count>0;}
$('#prompt-search')?.addEventListener('input',filterPrompts);$('#prompt-filter')?.addEventListener('change',filterPrompts);
$('[data-download-prompts]')?.addEventListener('click',()=>download('blueprint-50-action-prompts.txt',$$('[data-prompt-item]').map(x=>x.querySelector('.tag').textContent+'\n'+x.querySelector('h3').textContent+'\n\n'+x.querySelector('pre').textContent+'\n\n'+x.querySelector('.muted').textContent).join('\n\n---\n\n')));
function filterBooks(track){$$('[data-book-track]').forEach(x=>x.hidden=track!=='all'&&x.dataset.bookTrack!=='both'&&x.dataset.bookTrack!==track);}
$('#book-filter')?.addEventListener('change',e=>filterBooks(e.target.value));
function calculate(){const ids=['credits','attempt-cost','attempts','shots','extra','plan-cost'],v=ids.map(id=>$('#'+id).value.trim()===''?NaN:Number($('#'+id).value));const r=capacity({credits:v[0],cost:v[1],attempts:v[2],shots:v[3],extra:v[4],price:v[5]});status($('#credit-result'),r?`${r.perEdit.toLocaleString()} credits per finished edit · up to ${r.edits} edits under these assumptions. ${r.edits?`Subscription cost per estimated edit: ${r.perEditCost.toFixed(2)} in your entered currency.`:'The balance does not cover one complete edit.'}`:'Enter valid numbers. Attempt cost must be above zero; attempts and shots must be at least one.');}
if($('#credit-calculator')){calculate();$('#credit-calculator').addEventListener('input',calculate);$('#credit-calculator').addEventListener('submit',e=>e.preventDefault());}
const progress=$$('[data-progress]');if(progress.length){api('/api/progress').then(map=>{progress.forEach(b=>b.checked=!!map[b.dataset.progress]);updateReaderProgress();}).catch(e=>{const p=document.createElement('p');p.className='status';p.textContent=e.message;progress[0].parentNode.after(p);});progress.forEach(b=>b.addEventListener('change',async()=>{b.disabled=true;const wanted=b.checked;try{await api('/api/progress',{module:b.dataset.progress,done:wanted});let s=b.parentNode.querySelector('.inline-status');if(!s){s=document.createElement('span');s.className='inline-status';s.setAttribute('role','status');b.parentNode.append(s);}s.textContent='Saved';updateReaderProgress();}catch(e){b.checked=!wanted;let s=b.parentNode.querySelector('.inline-status');if(!s){s=document.createElement('span');s.className='inline-status';s.setAttribute('role','alert');b.parentNode.append(s);}s.textContent=e.message;}finally{b.disabled=false;}}));}
function updateReaderProgress(){if($('#reader-progress'))$('#reader-progress').value=progress.filter(b=>b.checked).length;}
let tasksVersion=0,taskRows=[];
function taskStats(){const done=taskRows.filter(x=>x.done).length,total=taskRows.length,pct=total?Math.round(done/total*100):0;$('#task-progress').value=pct;status($('#tasks-status'),`${done} / ${total} tasks complete · changes save to your account`);window.dispatchEvent(new CustomEvent('journalProgress',{detail:{pct,done,total}}));
 const box=$('#next-task'),next=taskRows.find(x=>!x.done);box.hidden=false;box.replaceChildren();const k=document.createElement('span');k.className='eyebrow';k.textContent=next?'Next unfinished task':'This list is complete';const h=document.createElement('h3');h.textContent=next?next.title:'Review the work and actual results';const p=document.createElement('p');p.textContent=next?next.detail:'Use feedback and your scorecard to choose one improvement.';box.append(k,h,p);const letter=next?.detail.match(/(?:^|\s)([A-J])\./)?.[1];if(letter||!next){const a=document.createElement('a');a.className='button';a.href=BOOK_PATHS[letter||'D'];a.textContent='Open the matching guide';box.append(a);}
}
async function loadTasks(){if(!$('#task-list'))return;const version=++tasksVersion,track=$('#task-track').value;status($('#tasks-status'),'Opening saved tasks…');try{const d=await api('/api/journal/checklist?track='+track);if(version!==tasksVersion)return;taskRows=d.tasks;renderTasks();taskStats();}catch(e){if(version===tasksVersion)status($('#tasks-status'),e.message);}}
function renderTasks(){const box=$('#task-list');box.replaceChildren();for(const row of taskRows){const item=document.createElement('article');item.className='task';item.dataset.done=!!row.done;const top=document.createElement('label');top.className='task-top';const check=document.createElement('input');check.type='checkbox';check.checked=!!row.done;const title=document.createElement('span');title.className='task-title';title.textContent=row.title;top.append(check,title);const detail=document.createElement('p');detail.textContent=row.detail;detail.className='muted';const notes=document.createElement('details'),summary=document.createElement('summary');summary.textContent='My notes'+(row.note?' · saved':'');const field=document.createElement('textarea');field.value=row.note||'';field.maxLength=5000;field.setAttribute('aria-label','Notes for '+row.title);const save=document.createElement('button');save.className='secondary';save.textContent='Save note';const msg=document.createElement('span');msg.className='inline-status';msg.setAttribute('role','status');notes.append(summary,field,save,msg);item.append(top,detail,notes);const m=row.detail.match(/(?:^|\s)([A-J])\./);if(m){const a=document.createElement('a');a.href=BOOK_PATHS[m[1]];a.textContent='Open playbook '+m[1];item.append(a);}box.append(item);
 check.addEventListener('change',async()=>{check.disabled=true;const desired=check.checked;try{await api('/api/journal/checklist',{action:'toggle',id:row.id,done:desired});row.done=desired;item.dataset.done=desired;taskStats();}catch(e){check.checked=!!row.done;status($('#tasks-status'),e.message);}finally{check.disabled=false;}});
 save.addEventListener('click',async()=>{save.disabled=true;try{await api('/api/journal/checklist',{action:'note',id:row.id,note:field.value});row.note=field.value;msg.textContent='Saved';summary.textContent='My notes · saved';}catch(e){msg.textContent=e.message;}finally{save.disabled=false;}});
 if(row.is_custom){const del=document.createElement('button');del.className='secondary';del.textContent='Delete personal task';del.addEventListener('click',async()=>{del.disabled=true;try{await api('/api/journal/checklist',{action:'delete',id:row.id});loadTasks();}catch(e){msg.textContent=e.message;del.disabled=false;}});notes.append(del);}
 }}
$('#task-track')?.addEventListener('change',loadTasks);$('#refresh-tasks')?.addEventListener('click',async e=>{e.target.disabled=true;try{await api('/api/journal/checklist',{action:'generate',track:$('#task-track').value});await loadTasks();}catch(err){status($('#tasks-status'),err.message);}finally{e.target.disabled=false;}});
$('#add-task')?.addEventListener('submit',async e=>{e.preventDefault();const input=e.target.elements.title,b=e.target.querySelector('button');b.disabled=true;try{await api('/api/journal/checklist',{action:'add',track:$('#task-track').value,title:input.value.trim()});input.value='';loadTasks();}catch(err){status($('#tasks-status'),err.message);}finally{b.disabled=false;}});
let sheetData=null,sheetVersion=0;
async function loadSheet(){if(!$('#sheet-table'))return;const version=++sheetVersion;status($('#sheet-status'),'Opening saved rows…');try{const d=await api('/api/journal/sheets?type='+$('#sheet-type').value);if(version!==sheetVersion)return;sheetData=d;renderSheet();status($('#sheet-status'),'Edit a cell, then leave it to save. Export a backup whenever you need.');}catch(e){if(version===sheetVersion)status($('#sheet-status'),e.message);}}
function renderSheet(){const table=document.createElement('table'),head=document.createElement('thead'),hr=document.createElement('tr');for(const col of sheetData.columns){const th=document.createElement('th');th.textContent=col;th.scope='col';if(sheetData.widths[col])th.style.minWidth=sheetData.widths[col];hr.append(th);}head.append(hr);table.append(head);const body=document.createElement('tbody');const sheet=sheetData;for(const row of sheet.rows){const tr=document.createElement('tr');for(const col of sheet.columns){const td=document.createElement('td'),options=sheet.dropdowns[col];let input;if(options){input=document.createElement('select');const all=['',...options];if(row[col]&&!all.includes(row[col]))all.push(row[col]);for(const value of all){const o=document.createElement('option');o.value=value;o.textContent=value||'—';input.append(o);}}else input=document.createElement('input');input.value=row[col]??'';input.setAttribute('aria-label',`${col}, row ${row.row_idx+1}`);input.addEventListener('change',async()=>{const previous=row[col],value=input.value;row[col]=value;const controls=[...tr.querySelectorAll('input,select')];controls.forEach(x=>x.disabled=true);status($('#sheet-status'),'Saving row '+(row.row_idx+1)+'…');try{const data={};for(const c of sheet.columns)data[c]=row[c]??'';await api('/api/journal/sheets',{type:sheet.sheet_type,row_idx:row.row_idx,data});if(sheetData===sheet)status($('#sheet-status'),'Row '+(row.row_idx+1)+' saved.');}catch(e){row[col]=previous;input.value=previous??'';if(sheetData===sheet)status($('#sheet-status'),e.message+' Your previous value is restored.');}finally{controls.forEach(x=>x.disabled=false);}});td.append(input);tr.append(td);}body.append(tr);}table.append(body);$('#sheet-table').replaceChildren(table);}
$('#sheet-type')?.addEventListener('change',loadSheet);$('#sheet-export')?.addEventListener('click',()=>{if(sheetData)download('blueprint-'+sheetData.sheet_type+'.csv',csvText(sheetData.columns,sheetData.rows),'text/csv');});$('#sheet-add')?.addEventListener('click',async e=>{e.target.disabled=true;try{await api('/api/journal/sheets',{type:$('#sheet-type').value,action:'add-row'});await loadSheet();}catch(err){status($('#sheet-status'),err.message);}finally{e.target.disabled=false;}});if($('#sheet-table'))loadSheet();

$$('[data-brand-image]').forEach(img=>img.addEventListener('error',()=>img.hidden=true));

if(location.hash==='#tasks'&&$('#tasks'))$('#tasks').open=true;
