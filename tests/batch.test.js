import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const run=(out,extra={})=>spawnSync(process.execPath,['--import','./tests/mock-provider.js','scripts/run-triage.js',out],{cwd:process.cwd(),encoding:'utf8',env:{...process.env,AI_PROVIDER:'groq',GROQ_API_KEY:'mock-key',...extra},timeout:15000});
test('batch retries 429 and resumes from checkpoint',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'triage-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const out=path.join(dir,'results.json');
 const first=run(out,{MOCK_RATE_LIMIT_ONCE:'1'});assert.equal(first.status,0,first.stderr);assert.match(first.stdout,/Rate limited/);assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).length,44);const checkpoint=JSON.parse(fs.readFileSync(out+'.triage-checkpoint.json','utf8'));assert.equal(Object.keys(checkpoint.completed).length,39);
 checkpoint.completed['60ca4feb6420652745f55522'].student_reply='We have fixed it.';fs.writeFileSync(out+'.triage-checkpoint.json',JSON.stringify(checkpoint));
 const again=run(out,{MOCK_RATE_LIMIT_ALWAYS:'1'});assert.equal(again.status,0,again.stderr);assert.match(again.stdout,/Resuming: 39/);assert.doesNotMatch(again.stdout,/Checking question/);assert.doesNotMatch(JSON.parse(fs.readFileSync(out,'utf8')).find(r=>r.questionId==='60ca4feb6420652745f55522').student_reply,/fixed/i);
});
test('batch stops on long quota reset without writing final output',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'triage-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const out=path.join(dir,'results.json');const result=run(out,{MOCK_RATE_LIMIT_ALWAYS:'1'});assert.equal(result.status,1);assert.match(result.stderr,/Rate limit \(429\)/);assert.equal(fs.existsSync(out),false);
});

test('batch asks the model to fix an invalid assessment and completes',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'triage-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const out=path.join(dir,'results.json');
 const result=run(out,{MOCK_INVALID_ONCE:'1'});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/Non-defects cannot carry repairs or edits/);assert.match(result.stdout,/Asking the model to reconsider/);assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).length,44);
});

test('saved complete batch is adjudicated reproducibly and known harmful AI edits are not promoted',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'adjudicate-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const output=path.join(dir,'results.json');
 const run=spawnSync('python3',['scripts/adjudicate-batch.py',output],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 assert.deepEqual(JSON.parse(fs.readFileSync(output,'utf8')),JSON.parse(fs.readFileSync('results.json','utf8')));
 const rows=JSON.parse(fs.readFileSync(output,'utf8'));assert.equal(rows.length,44);const by=id=>rows.find(x=>x.reportId===id);
 assert.equal(by('R004').verdict,'defect');assert.equal(by('R005').verdict,'defect');assert.equal(by('R016').repair,'solution_fix');assert.equal(by('R034').repair,'unsound');assert.equal(by('R012').route,'auto_apply');assert.equal(by('R022').route,'auto_apply');assert.match(by('R029').evidence,/horizontal/);assert.match(by('R031').evidence,/opposite directions/i);assert.match(by('R031').student_reply,/same direction/i);
});
