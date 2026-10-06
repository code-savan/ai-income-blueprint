export const ROUTES = {
 service: {label:'Services · Track B', list:'track-b', first:'/playbooks/playbook-f-content-service.html', action:'Finish a small delivery sample, then research and pitch suitable clients.', next:'/playbooks/playbook-a-land-first-client.html'},
 product: {label:'Products · Track A', list:'track-a', first:'/playbooks/playbook-b-launch-product.html', action:'Validate a narrow problem, finish a reusable download, then demonstrate it.', next:'/playbooks/playbook-c-faceless-funnel.html'}
};
export function diagnose(values){const p=values.filter(v=>v==='product').length,s=values.filter(v=>v==='service').length;return p===s?null:p>s?'product':'service';}
export function capacity({credits,cost,attempts,shots,extra,price}){
 if(![credits,cost,attempts,shots,extra,price].every(Number.isFinite)||credits<0||cost<=0||attempts<1||shots<1||extra<0||price<0)return null;
 const perEdit=cost*attempts*shots+extra,edits=Math.floor(credits/perEdit);
 return {perEdit,edits,perEditCost:edits?price/edits:null};
}
export function csvText(columns,rows){const cell=x=>'"'+String(x??'').replaceAll('"','""')+'"';return [columns,...rows.map(r=>columns.map(c=>r[c]??''))].map(r=>r.map(cell).join(',')).join('\r\n');}

export const BOOK_PATHS={A:'/playbooks/playbook-a-land-first-client.html',B:'/playbooks/playbook-b-launch-product.html',C:'/playbooks/playbook-c-faceless-funnel.html',D:'/playbooks/playbook-d-scale-to-2k.html',E:'/playbooks/playbook-e-carousel-leads.html',F:'/playbooks/playbook-f-content-service.html',G:'/playbooks/playbook-g-copywriting-project.html',H:'/playbooks/playbook-h-ai-video-creative.html',I:'/playbooks/playbook-i-lead-follow-up.html',J:'/playbooks/playbook-j-affiliate-product-demo.html'};
