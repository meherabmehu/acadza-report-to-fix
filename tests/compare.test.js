import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('comparison validates report IDs and detects differences',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'compare-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const rows=JSON.parse(fs.readFileSync('results.json','utf8'));const model=structuredClone(rows);model[0].verdict='no_error';model[0].repair=null;model[0].route='no_change';const file=path.join(dir,'candidate.json');fs.writeFileSync(file,JSON.stringify(model));
 const result=spawnSync(process.execPath,['scripts/compare-results.js','results.json',file],{cwd:process.cwd(),encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/R005/);assert.match(result.stdout,/1 differ/);
 model.pop();fs.writeFileSync(file,JSON.stringify(model));const bad=spawnSync(process.execPath,['scripts/compare-results.js','results.json',file],{cwd:process.cwd(),encoding:'utf8'});assert.equal(bad.status,1);assert.match(bad.stderr,/exactly one entry/);
});

test('comparison flags multiple forms of premature-fix replies',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'compare-replies-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const rows=JSON.parse(fs.readFileSync('results.json','utf8'));const model=structuredClone(rows);
 for(const id of ['R007','R008'])model.find(x=>x.reportId===id).student_reply="We've identified the value and added it to the question.";
 model.find(x=>x.reportId==='R016').student_reply='The solution has been updated accordingly.';
 model.find(x=>x.reportId==='R012').student_reply="We've noted the typo and will correct it after review.";
 const file=path.join(dir,'candidate.json');fs.writeFileSync(file,JSON.stringify(model));const result=spawnSync(process.execPath,['scripts/compare-results.js','results.json',file],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/R007: REVIEW REPLY/);assert.match(result.stdout,/R008: REVIEW REPLY/);assert.match(result.stdout,/R016: REVIEW REPLY/);assert.doesNotMatch(result.stdout,/R012: REVIEW REPLY/);assert.match(result.stdout,/3 possible premature-fix replies/);
});
