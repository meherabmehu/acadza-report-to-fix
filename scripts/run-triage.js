import 'dotenv/config';
// Optional batch LLM triage: one model call per reported question, one output per report.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {prepareModelInput, checkModelAssessment} from '../model.js';
import {providerConfig} from '../provider.js';
let ai;try {ai=providerConfig()} catch(e){console.error(e.message);process.exit(1)}
const key=ai.key;
if(!key){console.error('Set GROQ_API_KEY or OPENAI_API_KEY to run model triage.');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const questions=read('data/questions.json'), reports=read('data/reports.json'), taxonomy=read('data/taxonomy.json');
const prompt=fs.readFileSync('prompts/triage.txt','utf8');
const output=process.argv[2] || 'results.llm.json';
const checkpoint=output+'.triage-checkpoint.json';
const fingerprint=crypto.createHash('sha256').update(JSON.stringify({questions,reports,taxonomy,prompt,provider:ai.provider,model:ai.model})).digest('hex');
const writeAtomic=(file,value)=>{const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n',{mode:0o600});fs.renameSync(tmp,file)};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function delayFromRetryAfter(value,attempt){
 if(value){const seconds=Number(value);if(Number.isFinite(seconds)&&seconds>=0)return Math.ceil(seconds*1000);const when=Date.parse(value);if(Number.isFinite(when))return Math.max(0,when-Date.now());}
 return Math.min(30000*Math.pow(2,attempt),120000);
}
async function callModel(q,related,feedback){
 for(let attempt=0;attempt<=3;attempt++){
  const response=await fetch(ai.url,{method:'POST',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:ai.model,temperature:0,response_format:{type:'json_object'},messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(prepareModelInput(q,related,taxonomy))},...(feedback?[{role:'user',content:feedback}]:[])]})});
  if(response.status!==429){if(!response.ok)throw new Error(`Model request failed (${response.status}) for ${q._id}`);return response.json();}
  const wait=delayFromRetryAfter(response.headers.get('retry-after'),attempt);
  if(attempt===3 || wait>120000)throw new Error(`Rate limit (429) for ${q._id}. Wait${wait>120000?` at least ${Math.ceil(wait/60000)} minutes`: ' before retrying'} and run the same command again.`);
  console.log(`Rate limited (429). Waiting ${Math.ceil(wait/1000)} seconds before retry ${attempt+1}/3...`);
  await pause(wait);
 }
}
try {
 let progress={fingerprint,completed:{}};
 if(fs.existsSync(checkpoint)){
  progress=read(checkpoint);
  if(progress.fingerprint!==fingerprint || !progress.completed || typeof progress.completed!=='object')throw new Error(`The checkpoint does not match the current data, prompt or model. Move or delete ${checkpoint} to start a new run.`);
  console.log(`Resuming: ${Object.keys(progress.completed).length} questions already checked.`);
 }
 for(const q of questions){
  const related=reports.filter(r=>r.questionId===q._id);if(!related.length)continue;
  if(Object.hasOwn(progress.completed,q._id)){
   // Revalidate saved entries as safety rules evolve; never trust an old checkpoint blindly.
   const rechecked=checkModelAssessment(progress.completed[q._id],q,taxonomy);
   if(rechecked.warning)console.warn(`Discarded unsafe saved edit for ${q._id}: ${rechecked.warning}`);
   progress.completed[q._id]=rechecked.assessment;
   continue;
  }
  console.log(`Checking question ${q._id} (${related.length} reports)`);
  let checked, feedback='';
  for(let validationAttempt=0;validationAttempt<=2;validationAttempt++){
   const raw=await callModel(q,related,feedback);
   try {
    const out=JSON.parse(raw.choices[0].message.content);
    checked=checkModelAssessment(out,q,taxonomy);
    break;
   } catch(err) {
    if(validationAttempt===2)throw new Error(`Model response failed validation for ${q._id} after 3 attempts: ${err.message}`);
    console.log(`Model response failed validation: ${err.message} Asking the model to reconsider (${validationAttempt+1}/2)...`);
    feedback=`Your previous response failed validation: ${err.message}. Re-evaluate the question and reports independently. Return a valid JSON object following the system instructions. If verdict is not defect, repair and edit must both be null. If verdict is defect, provide a valid repair from the taxonomy. Do not invent edits.`;
   }
  }
  if(checked.warning)console.warn(`Discarded unsafe edit for ${q._id}: ${checked.warning}`);
  progress.completed[q._id]=checked.assessment;
  writeAtomic(checkpoint,progress);
 }
 writeAtomic(checkpoint,progress);
 const rows=reports.map(r=>{const assessment=progress.completed[r.questionId];if(!assessment)throw new Error(`Missing assessment for ${r.reportId}`);return {reportId:r.reportId,questionId:r.questionId,...assessment}});
 writeAtomic(output,rows);
 console.log(`Wrote ${rows.length} unverified assessments to ${output}. No edits were applied.`);
 console.log(`Checkpoint kept in ${checkpoint}; delete it if you want a fresh run.`);
}catch(e){console.error(`Batch stopped: ${e.message}\nCompleted work, if any, is saved in ${checkpoint}. Run the same command again to resume.`);process.exitCode=1}
