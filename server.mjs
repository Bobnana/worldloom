import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {validateWorld} from './model.mjs';
import {seedWorld} from './seed.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const data=process.env.WORLDLOOM_DATA || path.join(root,'world');
const port=Number(process.env.WORLDLOOM_PORT || 43127);
const token=randomBytes(32).toString('hex');
await fs.mkdir(path.join(data,'backups'),{recursive:true});
const worldPath=path.join(data,'world.json');
try{await fs.access(worldPath);}catch{await fs.writeFile(worldPath,JSON.stringify(seedWorld(),null,2));}
let revision=0,queue=Promise.resolve(),lastBackup=0;
const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
async function backup(force=false){
 if(!force && Date.now()-lastBackup<60000)return;
 await fs.copyFile(worldPath,path.join(data,'backups',new Date().toISOString().replace(/[:.]/g,'-')+'.json'));
 lastBackup=Date.now();
 const names=(await fs.readdir(path.join(data,'backups'))).sort();
 for(const name of names.slice(0,-40))await fs.unlink(path.join(data,'backups',name));
}
const server=http.createServer(async(req,res)=>{
 try{
  if(req.headers.host!==`127.0.0.1:${port}` && req.headers.host!==`localhost:${port}`)return json(res,403,{error:'Local access only.'});
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'");
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  if(req.method==='GET' && url.pathname==='/api/world')return json(res,200,{world:JSON.parse(await fs.readFile(worldPath,'utf8')),token,revision});
  if(req.method==='PUT' && url.pathname==='/api/world'){
   if(req.headers['x-worldloom-token']!==token || (req.headers.origin && req.headers.origin!==`http://${req.headers.host}`))return json(res,403,{error:'Save request rejected.'});
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>48*1024*1024)return json(res,413,{error:'World exceeds 48 MB. Use smaller images.'});chunks.push(chunk);}
   const body=Buffer.concat(chunks).toString('utf8');
   let input;try{input=JSON.parse(body);validateWorld(input.world);}catch(e){return json(res,400,{error:e.message});}
   const job=queue.then(async()=>{
    if(input.revision!==revision)return json(res,409,{error:'This world changed in another window. Export your current work before reloading.'});
    await backup(!!input.checkpoint);
    const handle=await fs.open(worldPath+'.tmp','w');
    try{await handle.writeFile(JSON.stringify(input.world,null,2));await handle.sync();}finally{await handle.close();}
    await fs.rename(worldPath+'.tmp',worldPath);revision++;
    json(res,200,{revision});
   });
   queue=job.catch(()=>{});await job;return;
  }
  if(req.method==='GET' && url.pathname==='/api/backups')return json(res,200,{files:(await fs.readdir(path.join(data,'backups'))).sort().reverse()});
  if(req.method==='GET' && url.pathname.startsWith('/api/backup/')){
   const name=decodeURIComponent(url.pathname.slice(12));if(!/^[0-9TZ.-]+\.json$/.test(name))return json(res,400,{error:'Invalid backup name.'});
   return json(res,200,JSON.parse(await fs.readFile(path.join(data,'backups',name),'utf8')));
  }
  const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/model.mjs':'../model.mjs','/landscape.svg':'landscape.svg'};
  const name=files[url.pathname];if(req.method!=='GET' || !name)return json(res,404,{error:'Not found'});
  const ext=path.extname(name),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
  res.writeHead(200,{'Content-Type':types[ext], 'Cache-Control':'no-cache'});res.end(await fs.readFile(path.join(root,'public',name)));
 }catch(e){console.error(e);if(!res.headersSent)json(res,500,{error:'Unable to read or save the world. Your previous saved file is preserved.'});else res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`Worldloom ready at http://127.0.0.1:${port}\nWorld folder: ${data}`));
