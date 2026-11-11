import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
test('project-authored arithmetic proxy stays consistent and warns it is not ground truth',()=>{
 const r=spawnSync(process.execPath,['scripts/proxy-evaluation.js'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/8\/8 report rows/);assert.match(r.stdout,/NOT Acadza ground truth/);
});
