import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {questionHash} from '../canonical.js';
const sourceQuestions=JSON.parse(fs.readFileSync('data/questions.json','utf8'));
const originalHash=id=>questionHash(sourceQuestions.find(q=>q._id===id));

test('public review records a durable, validated decision',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acadza-test-'));const port=33000+Math.floor(Math.random()*15000);const base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'production',STATE_FILE:path.join(dir,'state.json')}});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});
 let stderr='';child.stderr.on('data',chunk=>stderr+=chunk);
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server startup timeout: '+stderr)),8000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('exit',code=>{clearTimeout(timer);reject(Error(`server exited (${code}): ${stderr}`))});});
 let blocked=await fetch(base+'/api/data');assert.equal(blocked.status,200);assert.match(blocked.headers.get('content-security-policy'),/script-src 'self'/);assert.match(blocked.headers.get('permissions-policy'),/camera=\(\)/);let health=await fetch(base+'/api/health');assert.equal(health.status,200);assert.deepEqual(await health.json(),{ok:true,storage:'file'});
 const cookie='';
 const post=body=>fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({proposalId:'baseline:'+body.questionId,questionHash:originalHash(body.questionId),reviewVersion:null,...body})});
 let data=await (await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.equal(data.reports.length,44);assert.ok(data.reports.every(r=>!('studentId' in r)));
 assert.equal((await fetch(base+'/api/data')).status,200,'cached data is public');
 let invalid=await post({questionId:'60f744b3f1b9bc7cc7b4a949',action:'edit',reviewer:'Test faculty',note:'',edit:{field:'question',find:'In',replace:'Changed'}});assert.equal(invalid.status,400);
 let forged=await post({questionId:'60f744b3f1b9bc7cc7b4a949',action:'edit',reviewer:'Faculty',note:'',edit:{field:'solution',find:'50 V',replace:'not 50 V'}});assert.equal(forged.status,400);
 let ok=await post({questionId:'60f744b3f1b9bc7cc7b4a949',action:'approve',reviewer:'Test faculty',note:'Verified'});assert.equal(ok.status,200);
 let repeat=await post({questionId:'60f744b3f1b9bc7cc7b4a949',action:'approve',reviewer:'Test faculty',note:''});assert.equal(repeat.status,409);
 let state=JSON.parse(fs.readFileSync(path.join(dir,'state.json'),'utf8'));assert.equal(state.questions['60f744b3f1b9bc7cc7b4a949'].scq.answer,'A');assert.equal(state.audit.length,1);assert.equal(state.audit[0].before,'C');assert.equal(state.audit[0].after,'A');
 const id='622df25ab70e4b50e44ff837';
 const missingNote=await post({questionId:id,action:'defer',reviewer:'Faculty',note:''});assert.equal(missingNote.status,400);
 const deferred=await post({questionId:id,action:'defer',reviewer:'Faculty',note:'Find original diagram'});assert.equal(deferred.status,200);
 const blockedWhileDeferred=await post({questionId:id,action:'reject',reviewer:'Faculty',note:''});assert.equal(blockedWhileDeferred.status,409);
 const reopen=await post({questionId:id,action:'reopen',reviewer:'Faculty',note:'Source located'});assert.equal(reopen.status,200);
 const reviewed=await post({questionId:id,action:'review_no_change',reviewer:'Faculty',note:'Sent to content author'});assert.equal(reviewed.status,200);
 state=JSON.parse(fs.readFileSync(path.join(dir,'state.json'),'utf8'));assert.equal(state.questions[id],undefined);assert.deepEqual(state.audit.slice(0,3).map(e=>e.action),['review_no_change','reopen','defer']);
 const unchanged='6263d75bdd44e265ef926d97';
 const before=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json(),staleQuestion=before.questions.find(q=>q._id===unchanged),staleResult=before.results.find(r=>r.questionId===unchanged);
 assert.equal((await post({questionId:unchanged,action:'defer',reviewer:'Faculty',note:'review'})).status,200);assert.equal((await post({questionId:unchanged,action:'reopen',reviewer:'Faculty',note:'continue'})).status,200);
 const after=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.equal(after.questions.find(q=>q._id===unchanged).questionHash,staleQuestion.questionHash);assert.notEqual(after.questions.find(q=>q._id===unchanged).reviewVersion,staleQuestion.reviewVersion);
 const oldTab=await post({questionId:unchanged,proposalId:staleResult.proposalId,questionHash:staleQuestion.questionHash,reviewVersion:staleQuestion.reviewVersion,action:'approve',reviewer:'Faculty',note:'stale'});assert.equal(oldTab.status,409);
 const refreshed=await post({questionId:unchanged,action:'approve',reviewer:'Faculty',note:'fresh review',questionHash:staleQuestion.questionHash,reviewVersion:after.questions.find(q=>q._id===unchanged).reviewVersion});assert.equal(refreshed.status,200);
 const changed=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.equal(changed.decisions[unchanged].action,'approve');
 const nr=data.results.find(r=>r.route==='no_change');const nrId=nr.questionId;
 assert.equal((await post({questionId:nrId,action:'review_no_change',reviewer:'Faculty',note:'Read question and checked calculation'})).status,200);
 state=JSON.parse(fs.readFileSync(path.join(dir,'state.json'),'utf8'));assert.equal(state.questions[nrId],undefined);assert.equal(state.decisions[nrId].action,'review_no_change');
 const raw=(url,body)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
 for(const bad of ['toString','constructor','__proto__']){assert.equal((await raw('/api/decisions',{questionId:bad,action:'reopen',reviewer:'Faculty',note:'test'})).status,400)}
 const first='60f744b3f1b9bc7cc7b4a949';assert.equal((await post({questionId:first,action:'reopen',reviewer:'Faculty',note:'review again'})).status,200);const count=(await (await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json()).audit.length;
 assert.equal((await post({questionId:first,action:'approve',reviewer:'Faculty',note:'stale tab'})).status,409);assert.equal((await (await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json()).audit.length,count);

});

test('live analysis endpoint uses the provider response without applying it',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acadza-ai-'));const port=33000+Math.floor(Math.random()*15000);const base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['--import','./tests/mock-provider.js','server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'test',OPENAI_API_KEY:'mock-key',STATE_FILE:path.join(dir,'state.json')}});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});let stderr='';child.stderr.on('data',c=>stderr+=c);
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout: '+stderr)),8000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('exit',code=>{clearTimeout(timer);reject(Error(`server exited (${code}): ${stderr}`))})});
 const response=await fetch(base+'/api/analyse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:'60f744b3f1b9bc7cc7b4a949'})});assert.equal(response.status,200);
 const result=await response.json();assert.equal(result.assessment.route,'faculty_review');assert.equal(result.assessment.edit.replace,'A');assert.match(result.warning,/never applied/);
 const verify=await fetch(base+'/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:'60f744b3f1b9bc7cc7b4a949'})});assert.equal(verify.status,200);const independent=await verify.json();assert.equal(independent.answer,'A');assert.equal(independent.storedAnswer,'C');assert.match(independent.warning,/same model/);
 const data=await (await fetch(base+'/api/data')).json();assert.equal(data.questions.find(q=>q._id==='60f744b3f1b9bc7cc7b4a949').scq.answer,'C');assert.equal(data.audit.length,0);assert.equal(fs.existsSync(path.join(dir,'state.json')),false);
 const post=(url,body)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,...(body.questionId?{questionHash:originalHash(body.questionId),reviewVersion:null,...(body.reviewVersion!==undefined?{reviewVersion:body.reviewVersion}:{})}:{})})});
 assert.equal((await post('/api/proposals',{candidateId:'fake',reviewer:'Faculty'})).status,410);
 for(const bad of ['toString','constructor','__proto__'])for(const url of ['/api/analyse','/api/verify'])assert.equal((await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:bad})})).status,404);
 const another=await (await post('/api/analyse',{questionId:'60f744b3f1b9bc7cc7b4a949'})).json();
 let queued=await post('/api/proposals',{candidateId:result.candidateId,reviewer:'Faculty'});assert.equal(queued.status,200);assert.equal((await post('/api/proposals',{candidateId:result.candidateId,reviewer:'Faculty'})).status,410);
 let active=await (await fetch(base+'/api/data')).json();const grouped=active.results.filter(r=>r.questionId==='60f744b3f1b9bc7cc7b4a949');assert.equal(grouped.length,3);assert.ok(grouped.every(r=>r.source==='live_ai'&&r.proposalId===grouped[0].proposalId));assert.equal(active.questions.find(q=>q._id==='60f744b3f1b9bc7cc7b4a949').scq.answer,'C');
 const stale=await post('/api/decisions',{questionId:'60f744b3f1b9bc7cc7b4a949',proposalId:'baseline:60f744b3f1b9bc7cc7b4a949',action:'approve',reviewer:'Faculty',note:''});assert.equal(stale.status,409);
 const applied=await post('/api/decisions',{questionId:'60f744b3f1b9bc7cc7b4a949',proposalId:grouped[0].proposalId,reviewVersion:active.questions.find(q=>q._id==='60f744b3f1b9bc7cc7b4a949').reviewVersion,action:'approve',reviewer:'Faculty',note:'Verified'});assert.equal(applied.status,200);
 active=await (await fetch(base+'/api/data')).json();assert.equal(active.questions.find(q=>q._id==='60f744b3f1b9bc7cc7b4a949').scq.answer,'A');assert.equal(active.audit.length,2);assert.equal(active.audit[0].source,'live_ai');assert.equal(active.audit[1].proposal.edit.replace,'A');assert.ok(active.audit[1].proposal.model);
 assert.equal((await post('/api/decisions',{questionId:'60f744b3f1b9bc7cc7b4a949',proposalId:grouped[0].proposalId,action:'approve',reviewer:'Faculty',note:''})).status,409);
 assert.equal((await post('/api/decisions',{questionId:'60f744b3f1b9bc7cc7b4a949',proposalId:grouped[0].proposalId,action:'reopen',reviewer:'Faculty',note:'Recheck'})).status,200);
 assert.equal((await post('/api/proposals',{candidateId:another.candidateId,reviewer:'Faculty'})).status,409);
 active=await (await fetch(base+'/api/data')).json();assert.match(active.questions.find(q=>q._id==='60f744b3f1b9bc7cc7b4a949').editError,/changed/);
});

test('Groq-configured server sends requests to the Groq endpoint',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acadza-groq-'));const port=33000+Math.floor(Math.random()*15000);const base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['--import','./tests/mock-provider.js','server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'test',AI_PROVIDER:'groq',GROQ_API_KEY:'mock-groq-key',STATE_FILE:path.join(dir,'state.json')}});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});let stderr='';child.stderr.on('data',c=>stderr+=c);
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout: '+stderr)),8000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('exit',code=>{clearTimeout(timer);reject(Error(`server exited (${code}): ${stderr}`))})});
 const response=await fetch(base+'/api/analyse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:'60f744b3f1b9bc7cc7b4a949'})});assert.equal(response.status,200);const result=await response.json();assert.equal(result.assessment.route,'faculty_review');assert.equal(result.assessment.edit.replace,'A');
});

test('production refuses startup without an explicit state path',async()=>{
 const {spawnSync}=await import('node:child_process');const env={...process.env,NODE_ENV:'production',SESSION_SECRET:'x'};delete env.STATE_FILE;
 const result=spawnSync(process.execPath,['server.js'],{cwd:process.cwd(),env,encoding:'utf8',timeout:5000});assert.notEqual(result.status,0);assert.match(result.stderr,/STATE_FILE/);
});

test('failed state persistence rolls back decision and audit in memory',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acadza-fail-')),port=33000+Math.floor(Math.random()*15000),base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'test',STATE_FILE:path.join(dir,'missing','state.json')}});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout')),8000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('exit',code=>{clearTimeout(timer);reject(Error(`server exited ${code}`))})});
 const id='60f744b3f1b9bc7cc7b4a949';const response=await fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:id,proposalId:'baseline:'+id,questionHash:originalHash(id),reviewVersion:null,action:'approve',reviewer:'Faculty',note:''})});assert.equal(response.status,500);
 const data=await(await fetch(base+'/api/data')).json();assert.equal(data.questions.find(q=>q._id===id).scq.answer,'C');assert.equal(data.decisions[id],undefined);assert.equal(data.audit.length,0);
});

test('auto-apply is narrow, atomic, audited and idempotent across restart',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acadza-auto-')),port=33000+Math.floor(Math.random()*15000),base=`http://127.0.0.1:${port}`,file=path.join(dir,'state.json');
 let child; const start=async()=>{let stderr='';child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'test',AUTO_APPLY_SAFE:'false',STATE_FILE:file}});child.stderr.on('data',x=>stderr+=x);await new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('timeout: '+stderr)),8000);child.stdout.on('data',x=>{if(x.toString().includes('Faculty console listening')){clearTimeout(timer);resolve()}});child.once('exit',code=>{clearTimeout(timer);reject(Error('early exit '+code+': '+stderr))})})};
 t.after(()=>{child?.kill();fs.rmSync(dir,{recursive:true,force:true})});await start();
 const run=()=>fetch(base+'/api/auto-apply',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 const a=await Promise.all([run(),run()]);const sizes=await Promise.all(a.map(async x=>(await x.json()).applied.length));assert.deepEqual(sizes.sort(),[0,2]);
 let d=await(await fetch(base+'/api/data')).json();assert.equal(d.audit.filter(x=>x.action==='auto_apply').length,2);assert.ok(d.audit.filter(x=>x.action==='auto_apply').every(x=>x.before!==x.after));
 for(const id of ['61dffbec08489156b684bd22','61ee6c9d90a1a968a168686b']){assert.equal(d.decisions[id].action,'auto_apply');assert.match(d.results.find(x=>x.questionId===id).student_reply,/corrected/)}
 assert.equal(d.questions.find(x=>x._id==='60f744b3f1b9bc7cc7b4a949').scq.answer,'C');
 await new Promise(resolve=>{child.once('exit',resolve);child.kill()});await start();d=await(await fetch(base+'/api/data')).json();assert.equal(d.audit.filter(x=>x.action==='auto_apply').length,2);assert.equal((await(await run()).json()).applied.length,0);
});

test('startup auto-apply requires explicit opt-in',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acadza-start-auto-')),port=33000+Math.floor(Math.random()*15000),base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'test',AUTO_APPLY_SAFE:'true',STATE_FILE:path.join(dir,'state.json')}});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});
 await new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('timeout')),8000);child.stdout.on('data',x=>{if(x.toString().includes('Faculty console listening')){clearTimeout(timer);resolve()}});child.once('exit',()=>{clearTimeout(timer);reject(Error('early exit'))})});
 const d=await(await fetch(base+'/api/data')).json();assert.equal(d.audit.filter(x=>x.action==='auto_apply').length,2);
});
