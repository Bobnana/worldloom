import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
test('server serves a seeded world',async()=>{const data=await fs.mkdtemp(path.join(os.tmpdir(),'worldloom-test-'));const port=43129;const child=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,WORLDLOOM_DATA:data,WORLDLOOM_PORT:String(port)}});try{await new Promise(r=>setTimeout(r,300));const res=await fetch(`http://127.0.0.1:${port}/api/world`);assert.equal(res.status,200);const body=await res.json();assert.equal(body.world.entities.length,9);}finally{child.kill();}});
