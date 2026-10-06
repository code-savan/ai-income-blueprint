// Local-only preview with a fictional account and an in-memory SQLite database.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {setup} from '../tests/fixture.mjs';
import {onRequest as middleware} from '../functions/_middleware.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), {env}=setup();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain','.csv':'text/csv'};
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const url=new URL(req.url,'http://127.0.0.1:8765');const request=new Request(url,{method:req.method,headers:{...req.headers,Cookie:'__session=valid; '+(req.headers.cookie||'csrf_token=token')},...(body.length?{body}:{} )});
 const context={request,env,next:async()=>{if(url.pathname.startsWith('/api/')){const source=path.join(root,'functions',url.pathname+'.js');try{const mod=await import(source);return mod.onRequest(context);}catch(e){console.error(e);return new Response('Local API error',{status:500});}}
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))return new Response('Forbidden',{status:403});try{return new Response(await fs.readFile(file),{headers:{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}}};const result=await middleware(context);res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}catch(e){console.error(e);res.writeHead(500);res.end('Preview error');}});
server.listen(8765,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:8765 (fictional account, ephemeral data)'));
