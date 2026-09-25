import test from 'node:test';
import assert from 'node:assert/strict';
import {seedWorld} from '../seed.mjs';
import {validateWorld,dateOrdinal,removeEntity,treeLevels} from '../model.mjs';
test('sample world and custom calendar validate',()=>{const w=seedWorld();validateWorld(w);assert.equal(dateOrdinal({year:0,month:0,day:1},w.calendar),0);assert.equal(dateOrdinal({year:1,month:0,day:1},w.calendar),242);});
test('removing an entry cleans linked data',()=>{const w=seedWorld();removeEntity(w,'mira');validateWorld(w);assert.ok(!w.relations.some(r=>r.from==='mira'||r.to==='mira'));assert.ok(!w.boards[0].nodes.some(n=>n.entity==='mira'));});
test('invalid structures are rejected',()=>{const w=seedWorld();w.relations[0].to='missing';assert.throws(()=>validateWorld(w));});
test('tree layout orders parents before children',()=>{const levels=treeLevels([{id:'a'},{id:'b'},{id:'c'}],[{from:'a',to:'b'},{from:'b',to:'c'}]);assert.equal(levels.get('a'),0);assert.equal(levels.get('c'),2);});
