import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import pg from 'pg';

// Set ACADZA_TEST_DATABASE_URL only to a disposable dedicated test database.
test('PostgreSQL persists audited decisions across restart and serialises concurrent writes',{skip:!process.env.ACADZA_TEST_DATABASE_URL},async t=>{
 const url=process.env.ACADZA_TEST_DATABASE_URL;const pool=new pg.Pool({connectionString:url});await pool.query('DROP TABLE IF EXISTS acadza_workspace');
 const port=33000+Math.floor(Math.random()*15000),base=`http://127.0.0.1:${port}`;let child;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DATABASE_URL:url,NODE_ENV:'production',STATE_FILE:''}});let err='';child.stderr.on('data',c=>err+=c);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout: '+err)),8000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('exit',code=>{clearTimeout(timer);reject(Error('server exited '+code+': '+err))})})}
 async function stop(){if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill()})}
 t.after(async()=>{await stop();await pool.query('DROP TABLE IF EXISTS acadza_workspace');await pool.query('DROP TABLE IF EXISTS acadza_workspace_test_hold');await pool.end()});
 async function login(){return ''}
 await start();let health=await fetch(base+'/api/health');assert.equal(health.status,200);assert.deepEqual(await health.json(),{ok:true,storage:'postgres'});let cookie=await login();const id='60f744b3f1b9bc7cc7b4a949';const initialData=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json(),initialHash=initialData.questions.find(x=>x._id===id).questionHash;const decision=()=>fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({questionId:id,proposalId:'baseline:'+id,questionHash:initialHash,reviewVersion:null,action:'approve',reviewer:'DB test',note:'Checked'})});
 const port2=port+1000,base2=`http://127.0.0.1:${port2}`;let child2=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port2),DATABASE_URL:url,NODE_ENV:'production',STATE_FILE:''}});t.after(()=>child2?.kill());let err2='';child2.stderr.on('data',c=>err2+=c);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('second startup timeout: '+err2)),8000);child2.stdout.once('data',()=>{clearTimeout(timer);resolve()});child2.once('exit',code=>{clearTimeout(timer);reject(Error('second server exited '+code+': '+err2))})});
 const cookie2='';
 const concurrent=await Promise.all([decision(),decision()]);assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409]);
 const staleWrite=await fetch(base2+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie2},body:JSON.stringify({questionId:'622df25ab70e4b50e44ff837',proposalId:'baseline:622df25ab70e4b50e44ff837',action:'defer',reviewer:'Other instance',note:'concurrent review'})});assert.equal(staleWrite.status,503);assert.equal((await fetch(base2+'/api/data',{headers:{Cookie:cookie2}})).status,503);assert.equal((await fetch(base2+'/api/health')).status,503);
 await new Promise(resolve=>{child2.once('exit',resolve);child2.kill()});child2=null;
 const dbSnapshot=(await pool.query('SELECT state FROM acadza_workspace WHERE id=1')).rows[0].state;assert.equal(dbSnapshot.audit.length,1);assert.equal(dbSnapshot.decisions[id].action,'approve');

 await stop();await start();cookie=await login();const r=await fetch(base+'/api/data',{headers:{Cookie:cookie}});const data=await r.json();assert.equal(data.questions.find(q=>q._id===id).scq.answer,'A');assert.equal(data.audit.length,1);assert.equal(data.audit[0].reviewer,'DB test');
 const diagramId='622df25ab70e4b50e44ff837',q=data.questions.find(x=>x._id===diagramId),result=data.results.find(x=>x.questionId===diagramId);
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4AWP4DwQACfsD/c8LaHIAAAAASUVORK5CYII=';
 const post=(route,body)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
 const preview=await post('/api/author/preview',{questionId:diagramId,proposalId:result.proposalId,questionHash:q.questionHash,changes:{diagram:png}});assert.equal(preview.status,200);const previewId=(await preview.json()).previewId;
 await pool.query('ALTER TABLE acadza_workspace RENAME TO acadza_workspace_test_hold');
 health=await fetch(base+'/api/health');assert.equal(health.status,503);assert.deepEqual(await health.json(),{ok:false});
 const failedAuthor=await post('/api/author/commit',{previewId,reviewer:'DB test',note:'Reviewed diagram',attested:true,sourceDetails:'Original test drawing'});assert.equal(failedAuthor.status,500);
 const reopened=await fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({questionId:id,proposalId:'baseline:'+id,action:'reopen',reviewer:'DB test',note:'Check persistence failure'})});assert.equal(reopened.status,500);
 const after=await (await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.equal(after.decisions[id].action,'approve');assert.equal(after.audit.length,1);
 await pool.query('ALTER TABLE acadza_workspace_test_hold RENAME TO acadza_workspace');
 const missingSource=await post('/api/author/commit',{previewId,reviewer:'DB test',note:'Reviewed diagram',attested:true});assert.equal(missingSource.status,400);
 const saved=await post('/api/author/commit',{previewId,reviewer:'DB test',note:'Reviewed diagram',attested:true,sourceDetails:'Original test drawing'});assert.equal(saved.status,200);
 const preRestart=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();const hashBefore=preRestart.questions.find(x=>x._id===diagramId).questionHash;
 await stop();await start();cookie=await login();const persisted=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.equal(persisted.questions.find(x=>x._id===diagramId).renderedDiagrams[0],png);assert.equal(persisted.questions.find(x=>x._id===diagramId).questionHash,hashBefore);assert.equal(persisted.audit[0].action,'author_fix');assert.equal(persisted.audit[0].sourceDetails,'Original test drawing');assert.match(persisted.audit[0].attestation,/not independently verified/);
 // Concurrent writes to different questions are serialised without losing audit entries.
 const ids=[...new Set(persisted.results.map(x=>x.questionId))].filter(x=>!persisted.decisions[x]).slice(0,20);assert.equal(ids.length,20);
 const writes=await Promise.all(ids.map(questionId=>fetch(base+'/api/decisions',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({questionId,proposalId:'baseline:'+questionId,action:'defer',reviewer:'Load test',note:'Concurrent test review'})})));
 assert.deepEqual(writes.map(x=>x.status),Array(20).fill(200));const bulk=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.equal(bulk.audit.length,persisted.audit.length+20);assert.ok(ids.every(id=>bulk.decisions[id]?.action==='defer'));
 await stop();await start();cookie=await login();const durable=await(await fetch(base+'/api/data',{headers:{Cookie:cookie}})).json();assert.equal(durable.audit.length,persisted.audit.length+20);assert.ok(ids.every(id=>durable.decisions[id]?.action==='defer'));


});
