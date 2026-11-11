// Local, read-only smoke load. Spawns an isolated server; never targets production.
import {spawn} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {performance} from 'node:perf_hooks';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acadza-load-'));
const port=32000+Math.floor(Math.random()*12000),base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'test',DATABASE_URL:'',AUTO_APPLY_SAFE:'false',STATE_FILE:path.join(dir,'state.json')}});
let stderr='';child.stderr.on('data',x=>stderr+=x);
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout: '+stderr)),8000);child.stdout.on('data',x=>{if(x.toString().includes('Faculty console listening')){clearTimeout(timer);resolve()}});child.once('exit',()=>{clearTimeout(timer);reject(Error('startup failed: '+stderr))})});
 for(const concurrency of [10,25]){
  const total=250,latencies=[],failures=[];let next=0;const start=performance.now();
  async function worker(){while(true){const n=next++;if(n>=total)return;const t=performance.now();try{const r=await fetch(base+'/api/data',{signal:AbortSignal.timeout(20000)});const data=await r.json();if(r.status!==200||data.reports?.length!==44)throw Error('Invalid response '+r.status)}catch(e){failures.push(e.message)}latencies.push(performance.now()-t)}}
  await Promise.all(Array.from({length:concurrency},worker));const seconds=(performance.now()-start)/1000;latencies.sort((a,b)=>a-b);const p=q=>Math.round(latencies[Math.ceil(latencies.length*q)-1]);
  console.log(JSON.stringify({endpoint:'/api/data',requests:total,concurrency,failures:failures.length,seconds:+seconds.toFixed(2),requestsPerSecond:+(total/seconds).toFixed(1),p50ms:p(.5),p95ms:p(.95),p99ms:p(.99)}));if(failures.length)process.exitCode=1;
 }
}finally{child.kill();fs.rmSync(dir,{recursive:true,force:true})}
