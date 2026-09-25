export const TYPES = ['Character','Location','Faction','Creature','Ecology','Item','Event','Lore'];
export function validateWorld(w) {
  if (!w || w.format !== 'worldloom' || w.version !== 1) throw Error('This is not a Worldloom version 1 world.');
  if (typeof w.name !== 'string' || !w.name.trim() || w.name.length > 200) throw Error('Give the world a name (up to 200 characters).');
  if(typeof w.description!=='string')throw Error('Invalid world description.');
  for (const k of ['entities','relations','maps','boards']) if (!Array.isArray(w[k]) || w[k].length > 20000) throw Error('Invalid '+k+'.');
  const c = w.calendar;
  if (!c || !Array.isArray(c.months) || !c.months.length || c.months.length > 30 || !Array.isArray(c.weekdays) || !c.weekdays.length || c.weekdays.length > 20) throw Error('Invalid calendar.');
  if (c.months.some(m => typeof m.name !== 'string' || !m.name.trim() || !Number.isInteger(m.days) || m.days < 1 || m.days > 100)) throw Error('Months need a name and 1–100 days.');
  if (c.weekdays.some(d => typeof d !== 'string' || !d.trim())) throw Error('Weekdays need names.');
  if(typeof c.era!=='string' || !Number.isInteger(c.currentYear) || Math.abs(c.currentYear)>1000000)throw Error('Invalid calendar era or current year.');
  const idSet = new Set();
  for (const list of [w.entities,w.relations,w.maps,w.boards]) for (const x of list) {
    if (!x || typeof x.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(x.id) || idSet.has(x.id)) throw Error('Invalid or duplicate record ID.');
    idSet.add(x.id);
  }
  const entities = new Set(w.entities.map(e=>e.id));
  for (const e of w.entities) {
    if (typeof e.name !== 'string' || !e.name.trim() || typeof e.type !== 'string' || typeof e.body !== 'string' || typeof e.summary !== 'string' || !Array.isArray(e.tags) || e.tags.some(t=>typeof t!=='string') || !Array.isArray(e.properties) || e.properties.some(p=>!p || typeof p.key!=='string' || typeof p.value!=='string')) throw Error('Invalid entry.');
    if (e.image && !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(e.image)) throw Error('Unsupported image. Use PNG, JPG, WebP, or GIF.');
    if(e.date) dateOrdinal(e.date,c);
  }
  for (const r of w.relations) if (!entities.has(r.from) || !entities.has(r.to) || typeof r.label !== 'string' || !['connection','family'].includes(r.kind)) throw Error('A relationship points to a missing entry.');
  for (const m of w.maps) {
    if(typeof m.name!=='string' || !Array.isArray(m.pins) || !Array.isArray(m.regions)) throw Error('Invalid map.');
    if(m.image && !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(m.image)) throw Error('Invalid map image.');
    for(const p of m.pins) if(!p || !safeId(p.id) || !entities.has(p.entity) || !finiteXY(p)) throw Error('Invalid map pin.');
    for(const r of m.regions) if(typeof r.name!=='string' || !Array.isArray(r.points) || r.points.length<3 || r.points.some(p=>!finiteXY(p)) || (r.entity && !entities.has(r.entity))) throw Error('Invalid map region.');
  }
  for(const b of w.boards) {
    if(typeof b.name!=='string' || !Array.isArray(b.nodes)) throw Error('Invalid canvas.');
    for(const n of b.nodes) if(!n || !safeId(n.id) || !Number.isFinite(n.x) || !Number.isFinite(n.y) || (n.entity && !entities.has(n.entity)) || (n.text!==undefined && typeof n.text!=='string')) throw Error('Invalid canvas card.');
  }
  return w;
}
function finiteXY(p){ return p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.x<=100 && p.y>=0 && p.y<=100; }
function safeId(id){return typeof id==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id);}
export function dateOrdinal(date,c) {
  if(!Number.isInteger(date.year) || Math.abs(date.year)>1000000 || !Number.isInteger(date.month) || date.month<0 || date.month>=c.months.length || !Number.isInteger(date.day) || date.day<1 || date.day>c.months[date.month].days) throw Error('Date is outside this calendar.');
  return date.year*c.months.reduce((s,m)=>s+m.days,0)+c.months.slice(0,date.month).reduce((s,m)=>s+m.days,0)+date.day-1;
}
export function removeEntity(w,id) {
  w.entities=w.entities.filter(e=>e.id!==id);
  w.relations=w.relations.filter(r=>r.from!==id && r.to!==id);
  w.maps.forEach(m=>{m.pins=m.pins.filter(p=>p.entity!==id);m.regions.forEach(r=>{if(r.entity===id)r.entity='';});});
  w.boards.forEach(b=>b.nodes=b.nodes.filter(n=>n.entity!==id));
  return w;
}
export function treeLevels(nodes,relations){
 const ids=new Set(nodes.map(n=>n.id)),incoming=new Map(nodes.map(n=>[n.id,0])),children=new Map(nodes.map(n=>[n.id,[]]));
 for(const r of relations)if(ids.has(r.from)&&ids.has(r.to)&&r.from!==r.to){incoming.set(r.to,incoming.get(r.to)+1);children.get(r.from).push(r.to);}
 const levels=new Map(),queue=nodes.filter(n=>incoming.get(n.id)===0).map(n=>n.id);
 queue.forEach(id=>levels.set(id,0));
 for(let i=0;i<queue.length;i++){const id=queue[i];for(const child of children.get(id)){levels.set(child,Math.max(levels.get(child)||0,levels.get(id)+1));incoming.set(child,incoming.get(child)-1);if(incoming.get(child)===0)queue.push(child);}}
 const visited=new Set(queue);for(const n of nodes)if(!visited.has(n.id))levels.set(n.id,0);
 return levels;
}
