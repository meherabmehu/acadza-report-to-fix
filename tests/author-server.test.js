import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
test('faculty author preview and commit are public, scoped, stale-safe and audited',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'author-test-')),port=33000+Math.floor(Math.random()*15000),base=`http://127.0.0.1:${port}`,file=path.join(dir,'state.json');
 let child;async function start(){let stderr='';child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'production',PORT:String(port),STATE_FILE:file,AUTO_APPLY_SAFE:'false'}});child.stderr.on('data',c=>stderr+=c);await new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('startup timeout')),8000);child.stdout.on('data',x=>{if(x.toString().includes('Faculty console listening')){clearTimeout(timer);resolve()}});child.once('exit',()=>{clearTimeout(timer);reject(Error('startup failed: '+stderr))})})}
 t.after(()=>{child?.kill();fs.rmSync(dir,{recursive:true,force:true})});await start();
 const login=async()=>'';let cookie=await login();
 const post=(url,body,auth=true)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 assert.equal((await post('/api/author/preview',{},false)).status,404);
 let d=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();const id='622f08d7b70e4b50e4500a1b',q=d.questions.find(x=>x._id===id),r=d.results.find(x=>x.questionId===id);
 assert.match(d.questions.find(x=>x._id==='68e872546e45ba37dcc16bc0').renderedSolution,/<mover>/);
 const payload={questionId:id,proposalId:r.proposalId,questionHash:q.questionHash,changes:{question:q.scq.question.replace('</h3>','<br/>(D) 5 m/s</h3>')}};
 assert.equal((await post('/api/author/preview',{...payload,questionHash:'fake'})).status,409);
 assert.equal((await post('/api/author/preview',{...payload,changes:{chapter:'bad'}})).status,400);
 const u=d.questions.find(x=>x._id==='695ee00b88d7701e561aabc5'),ur=d.results.find(x=>x.questionId===u._id);const conflict=await post('/api/author/preview',{questionId:u._id,questionHash:u.questionHash,proposalId:ur.proposalId,changes:{answer:'C'}});assert.equal(conflict.status,400);assert.match((await conflict.json()).error,/Independent sample guard/);
 const stalePreview=await(await post('/api/author/preview',payload)).json();
 const decide=(action,note)=>post('/api/decisions',{questionId:id,proposalId:r.proposalId,action,reviewer:'Reviewer',note});
 assert.equal((await decide('defer','Investigate')).status,200);assert.equal((await decide('reopen','Continue')).status,200);
 assert.equal((await post('/api/author/commit',{previewId:stalePreview.previewId,reviewer:'Reviewer',note:'Old preview',attested:true})).status,409);
 const a=await(await post('/api/author/preview',payload)).json(),b=await(await post('/api/author/preview',payload)).json();assert.match(a.after.question,/5 m\/s/);
 assert.equal((await post('/api/author/commit',{previewId:a.previewId,reviewer:'',note:'source',attested:true})).status,400);
 assert.equal((await post('/api/author/commit',{previewId:a.previewId,reviewer:'Reviewer',note:'Checked',attested:false})).status,400);
 assert.equal((await post('/api/author/commit',{previewId:a.previewId,reviewer:'Reviewer',note:'Compared source',attested:true})).status,200);
 assert.equal((await post('/api/author/commit',{previewId:a.previewId,reviewer:'Reviewer',note:'repeat',attested:true})).status,410);
 assert.equal((await post('/api/author/commit',{previewId:b.previewId,reviewer:'Reviewer',note:'stale',attested:true})).status,409);
 d=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.equal(d.decisions[id].action,'author_fix');assert.equal(d.audit[0].action,'author_fix');assert.match(d.audit[0].after.scq.question,/5 m\/s/);assert.equal(d.audit[0].before.scq.question,q.scq.question);
 await new Promise(resolve=>{child.once('exit',resolve);child.kill()});await start();cookie=await login();d=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.match(d.questions.find(x=>x._id===id).scq.question,/5 m\/s/);assert.equal(d.audit[0].reviewer,'Reviewer');
});

test('a structurally valid but wrong AI answer is blocked on application',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'answer-guard-')),port=33000+Math.floor(Math.random()*15000),base=`http://127.0.0.1:${port}`,file=path.join(dir,'state.json');
 const child=spawn(process.execPath,['--import','./tests/mock-provider.js','server.js'],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'test',PORT:String(port),AI_PROVIDER:'groq',GROQ_API_KEY:'mock',STATE_FILE:file,MOCK_BAD_ANSWER:'1',AUTO_APPLY_SAFE:'false'}});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});await new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('startup timeout')),8000);child.stdout.on('data',x=>{if(x.toString().includes('Faculty console listening')){clearTimeout(timer);resolve()}});child.once('exit',()=>{clearTimeout(timer);reject(Error('startup failed'))})});
 const post=(url,body)=>fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const id='6263d75bdd44e265ef926d97',a=await(await post('/api/analyse',{questionId:id})).json();assert.equal(a.assessment.edit.replace,'40');
 assert.equal((await post('/api/proposals',{candidateId:a.candidateId,reviewer:'Test'})).status,200);let data=await(await fetch(base+'/api/data')).json();const proposal=data.results.find(x=>x.questionId===id);
 const response=await post('/api/decisions',{questionId:id,questionHash:data.questions.find(x=>x._id===id).questionHash,reviewVersion:data.questions.find(x=>x._id===id).reviewVersion,proposalId:proposal.proposalId,action:'approve',reviewer:'Test',note:'test'});assert.equal(response.status,400);assert.match((await response.json()).error,/20 cm, not 40/);
 data=await(await fetch(base+'/api/data')).json();assert.equal(data.questions.find(x=>x._id===id).integerQuestion.answer,'20');assert.equal(data.decisions[id],undefined);
});

test('API rejects invalid request encoding with JSON errors',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'api-errors-')),port=33000+Math.floor(Math.random()*15000),base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'test',PORT:String(port),STATE_FILE:path.join(dir,'state.json'),AUTO_APPLY_SAFE:'false'}});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});await new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('timeout')),8000);child.stdout.on('data',x=>{if(x.toString().includes('Faculty console listening')){clearTimeout(timer);resolve()}});child.once('exit',()=>{clearTimeout(timer);reject(Error('startup failed'))})});
 let cross=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://attacker.example'},body:'{}'});assert.equal(cross.status,403);
 cross=await fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json','Sec-Fetch-Site':'cross-site'},body:'{}'});assert.equal(cross.status,403);
 let same=await fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:'{}'});assert.equal(same.status,400);
 let r=await fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});assert.equal(r.status,415);assert.ok((await r.json()).error);
 r=await fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(r.status,400);assert.match((await r.json()).error,/Malformed/);
 r=await fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x:'a'.repeat(600000)})});assert.equal(r.status,413);assert.ok((await r.json()).error);
 r=await fetch(base+'/api/not-a-route');assert.equal(r.status,404);assert.ok((await r.json()).error);
});
