import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
test('reference evaluation checks coverage, identity and taxonomy and scores exact fields',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'labels-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'labels.json'),rows=JSON.parse(fs.readFileSync('results.json','utf8'));
 const run=()=>spawnSync(process.execPath,['scripts/evaluate-labels.js',file],{encoding:'utf8'});fs.writeFileSync(file,JSON.stringify(rows));let r=run();assert.equal(r.status,0,r.stderr);let out=JSON.parse(r.stdout);assert.equal(out.reportRows,44);assert.equal(out.verdictAgreement,1);assert.equal(out.jointAgreement,1);assert.equal(out.questionWeightedJointAgreement,1);assert.match(out.warning,/not independent/);
 rows[0].verdict='no_error';rows[0].repair=null;fs.writeFileSync(file,JSON.stringify(rows));r=run();assert.equal(r.status,0,r.stderr);out=JSON.parse(r.stdout);assert.equal(out.verdictMatches,43);assert.equal(out.jointVerdictRepairMatches,43);assert.equal(out.questionWeightedJointAgreement,0.9744);
 rows[0].questionId='fake';fs.writeFileSync(file,JSON.stringify(rows));r=run();assert.notEqual(r.status,0);assert.match(r.stderr,/question ID/);
 rows.pop();fs.writeFileSync(file,JSON.stringify(rows));assert.notEqual(run().status,0);
});
