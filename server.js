import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import pg from 'pg';
import {validateEdit, applyEdit} from './lib.js';
import {prepareModelInput, checkModelAssessment, imageContext} from './model.js';
import {providerConfig} from './provider.js';
import {autoEligible} from './auto-policy.js';
import {authorFields,buildAuthoredQuestion,safeStoredDiagrams} from './authoring.js';
import {domainAnswerConflict} from './domain-checks.js';
import {questionHash,matchesQuestionHash} from './canonical.js';
const app=express(), root=process.cwd(), load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const questions=load('data/questions.json'), reports=load('data/reports.json'), results=load('results.json'), taxonomy=load('data/taxonomy.json');
const statePath=process.env.STATE_FILE || path.join(root,'state.json');
const databaseUrl=process.env.DATABASE_URL || '';
const pool=databaseUrl?new pg.Pool({connectionString:databaseUrl,connectionTimeoutMillis:10000}):null;
// PostgreSQL is optional locally but takes precedence when configured. Startup fails closed if unavailable.
if(pool)await pool.query('CREATE TABLE IF NOT EXISTS acadza_workspace (id integer PRIMARY KEY CHECK (id = 1), state jsonb NOT NULL)');
const emptyState=()=>({questions:{},decisions:{},audit:[],proposals:{}});
const loaded=pool?(await pool.query('SELECT state FROM acadza_workspace WHERE id = 1')).rows[0]?.state:(fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):null);
// Preserve the exact loaded database snapshot for compare-and-swap, before migrations.
let storedStateJSON=loaded?JSON.stringify(loaded):null;
let storageConflict=false;
let state=loaded || emptyState();
state.proposals ||= {};
const candidates=new Map();
const qhash=questionHash;
const questionById=new Map(questions.map(q=>[q._id,q]));
const getQuestion=id=>typeof id==='string'&&questionById.has(id)?(Object.hasOwn(state.questions,id)?state.questions[id]:questionById.get(id)):undefined;
const latestAuditId=id=>state.audit.find(e=>e.questionId===id)?.id||null;
const baseline=id=>results.find(r=>r.questionId===id);
const assessment=id=>!questionById.has(id)?null:(Object.hasOwn(state.proposals,id)?state.proposals[id]:null) || (baseline(id)?{...baseline(id),source:'precomputed',proposalId:'baseline:'+id}:null);
const closed=d=>Boolean(d && d.action!=='defer');
const save=async next=>{
 if(pool){const nextJSON=JSON.stringify(next);const result=await pool.query('INSERT INTO acadza_workspace (id,state) VALUES (1,$1::jsonb) ON CONFLICT (id) DO UPDATE SET state=EXCLUDED.state WHERE $2::jsonb IS NOT NULL AND acadza_workspace.state=$2::jsonb',[nextJSON,storedStateJSON]);if(result.rowCount!==1){storageConflict=true;const err=Error('Workspace changed outside this process; restart this server to reload safely.');err.code='WORKSPACE_CONFLICT';throw err}storedStateJSON=nextJSON;return}
 const tmp=statePath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(next,null,2),{mode:0o600});fs.renameSync(tmp,statePath);
};
if(process.env.NODE_ENV==='production' && !process.env.STATE_FILE && !databaseUrl) { console.error('Production requires DATABASE_URL or STATE_FILE on persistent storage.'); process.exit(1); }
app.disable('x-powered-by');
app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'",'Permissions-Policy':'camera=(), microphone=(), geolocation=()'});next()});
// Browser writes must be same-origin; missing Origin is allowed for non-browser API clients.
app.use('/api',(req,res,next)=>{if(req.method==='POST'){
 const origin=req.get('Origin'),site=req.get('Sec-Fetch-Site');
 if(site==='cross-site')return res.status(403).json({error:'Cross-site requests are not allowed.'});
 if(origin){try{const parsed=new URL(origin);if(!['http:','https:'].includes(parsed.protocol)||parsed.host!==req.get('Host'))return res.status(403).json({error:'Origin does not match this workspace.'})}catch{return res.status(403).json({error:'Invalid origin.'})}}
 }next()});
app.use('/api',(req,res,next)=>{if(req.method==='POST'&&!req.is('application/json'))return res.status(415).json({error:'Use application/json for API requests.'});next()});
app.use(express.json({limit:'512kb'}));
// Public demo: every visitor can read and modify the sample workspace.
app.get('/api/health',async(req,res)=>{try{if(storageConflict)throw Error('Workspace snapshot is stale');if(pool)await pool.query({text:'SELECT 1 FROM acadza_workspace LIMIT 1',query_timeout:5000});res.json({ok:true,storage:pool?'postgres':'file'})}catch{res.status(503).json({ok:false})}});
app.use('/api',(req,res,next)=>{if(storageConflict)return res.status(503).json({error:'Workspace changed outside this server. An administrator must restart this server before continuing.'});next()});
const persistenceError=(res,e,fallback)=>e?.code==='WORKSPACE_CONFLICT'?res.status(503).json({error:'Workspace changed outside this server. An administrator must restart this server before continuing.'}):res.status(500).json({error:fallback});
const safeMarkup = html => sanitizeHtml(html || '', {allowedTags:['p','h1','h2','h3','h4','span','br','div','b','strong','em','i','sup','sub','ul','ol','li','table','thead','tbody','tr','td','th','math','mrow','mi','mn','mo','mfrac','msup','msub','msubsup','msqrt','mroot','mover','munder','munderover','mstyle','mtext','mspace','mfenced','mtable','mtr','mtd','semantics','annotation'],allowedAttributes:{math:['xmlns','display'], '*':['mathvariant','displaystyle','stretchy','fence','form','linebreak','columnalign','rowalign']},allowedSchemes:[]});
const visibleQuestion=q=>{const r=assessment(q._id),editError=['auto_apply','author_fix','approve','edit'].includes(state.decisions[q._id]?.action)?null:r?.source==='live_ai'&&!matchesQuestionHash(q,r.questionHash)?'Question changed after this assessment; run a new AI check.':r?.edit?validateEdit(q,r.repair,r.edit,taxonomy):null,valid=r?.edit&&!editError&&!state.decisions[q._id];const proposed=valid?applyEdit(q,r.edit):null;return {...q,questionHash:qhash(q),reviewVersion:latestAuditId(q._id),authorFields:r?.verdict==='defect'?authorFields(r.repair,taxonomy):[],renderedDiagrams:safeStoredDiagrams(q),editError,renderedQuestion:safeMarkup(q[q.questionType]?.question),renderedSolution:safeMarkup(q[q.questionType]?.solution),renderedProposed:proposed&&r.edit.field!=='answer'?safeMarkup(proposed[proposed.questionType][r.edit.field]):null}};
// Immutable snapshot identity changes only after a successful durable write. Cache only the
// authenticated view; this process does not support multiple writers/instances.
let cachedState=null,cachedData='';
app.get('/api/data',(req,res)=>{
 if(cachedState!==state){
  cachedData=JSON.stringify({questions:questions.map(q=>visibleQuestion(state.questions[q._id]||q)),reports:reports.map(({studentId,...r})=>r),results:results.map(r=>({...r,...assessment(r.questionId),reportId:r.reportId,questionId:r.questionId,...(state.decisions[r.questionId]?.action==='auto_apply'?{student_reply:'Thanks for reporting this. The spelling has been corrected in this review workspace.'}:['author_fix','approve','edit'].includes(state.decisions[r.questionId]?.action)?{student_reply:'Thanks for reporting this. A reviewer has recorded a change in this review workspace.'}:['reject','review_no_change'].includes(state.decisions[r.questionId]?.action)?{student_reply:'Thanks for reporting this. The reviewer recorded a decision without making a content change in this step.'}:{})})),taxonomy,decisions:Object.fromEntries(Object.entries(state.decisions).map(([id,d])=>[id,{...d,reviewer:typeof d.reviewer==='string'&&d.reviewer.includes('@')?'Previous reviewer':d.reviewer}])),audit:state.audit.map(e=>e.actor?.method==='supabase_mfa'?{...e,reviewer:'Previous reviewer',actor:{method:'previous_individual_redacted'}}:{...e,reviewer:typeof e.reviewer==='string'&&e.reviewer.includes('@')?'Previous reviewer':e.reviewer}),demo:true});
  cachedState=state;
 }
 res.type('application/json').send(cachedData);
});
app.post('/api/analyse',async(req,res)=>{
 let ai;try { ai=providerConfig(); } catch(e) { return res.status(503).json({error:e.message}); }
 const key=ai.key;if(!key)return res.status(503).json({error:'Live AI is not configured. Set GROQ_API_KEY or OPENAI_API_KEY and restart the server.'});
 const q=getQuestion(req.body.questionId);if(!q)return res.status(404).json({error:'Question not found.'});
 const auditAtStart=latestAuditId(q._id);
 const related=reports.filter(r=>r.questionId===q._id); const prompt=fs.readFileSync(path.join(root,'prompts/triage.txt'),'utf8');
 try {const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
 const response=await fetch(ai.url,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({model:ai.model,temperature:0,response_format:{type:'json_object'},messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(prepareModelInput(q,related,taxonomy))}]})});clearTimeout(timer);
 if(!response.ok)throw new Error('Model service request failed ('+response.status+').');const raw=await response.json();const out=JSON.parse(raw.choices[0].message.content);
 const checked=checkModelAssessment(out,q,taxonomy);
 const now=Date.now();for(const [id,c] of candidates)if(c.expires<=now)candidates.delete(id);
 if(candidates.size>=200)candidates.delete(candidates.keys().next().value);
 const candidateId=crypto.randomUUID();candidates.set(candidateId,{questionId:q._id,questionHash:qhash(q),auditAtStart,assessment:checked.assessment,warning:checked.warning,provider:ai.provider,model:ai.model,generatedAt:new Date(now).toISOString(),expires:now+15*60*1000});
 res.json({candidateId,assessment:checked.assessment,warning:checked.warning||'AI output is unverified and never applied automatically.'});
 }catch(e){res.status(502).json({error:'Live analysis failed: '+e.message})}
});
app.post('/api/verify',async(req,res)=>{
 let ai;try{ai=providerConfig()}catch(e){return res.status(503).json({error:e.message})}
 if(!ai.key)return res.status(503).json({error:'Live AI is not configured. Set GROQ_API_KEY or OPENAI_API_KEY and restart the server.'});
 const q=getQuestion(req.body.questionId);
 if(!q)return res.status(404).json({error:'Question not found.'});
 const input={questionType:q.questionType,subject:q.subject,question:q[q.questionType]?.question,imageContext:imageContext(q)};
 const prompt=fs.readFileSync(path.join(root,'prompts/independent-solve.txt'),'utf8');
 try{
  const response=await fetch(ai.url,{method:'POST',signal:AbortSignal.timeout(45000),headers:{'Content-Type':'application/json',Authorization:'Bearer '+ai.key},body:JSON.stringify({model:ai.model,temperature:0,response_format:{type:'json_object'},messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(input)}]})});
  if(!response.ok)throw Error(`Model service request failed (${response.status}).`);
  const raw=await response.json(), out=JSON.parse(raw.choices[0].message.content);
  if(!(typeof out.answer==='string'||out.answer===null)||typeof out.reasoning!=='string'||!out.reasoning.trim()||typeof out.uncertainty!=='string')throw Error('Independent solve returned an invalid response.');
  res.json({answer:out.answer?.slice(0,500)??null,reasoning:out.reasoning.slice(0,2000),uncertainty:out.uncertainty.slice(0,1000),storedAnswer:q[q.questionType].answer,warning:'Separate prompt, same model: agreement is not proof. No changes are applied.'});
 }catch(e){res.status(502).json({error:'Independent solve failed: '+e.message})}
});
// Serialise writes in this process. The single-snapshot store is not safe for multiple server instances.
let writeTail=Promise.resolve();
const serialise=handler=>async(req,res,next)=>{const previous=writeTail;let release;writeTail=new Promise(resolve=>release=resolve);await previous;try{await handler(req,res)}catch(e){next(e)}finally{release()}};
// Explicitly place an unverified model output into the faculty queue; never change a question here.
app.post('/api/proposals',serialise(async(req,res)=>{
 const {candidateId}=req.body, reviewer=req.body.reviewer, candidate=candidates.get(candidateId), now=Date.now();
 if(!candidate||candidate.expires<=now)return res.status(410).json({error:'The live assessment expired. Run the AI check again.'});
 if(typeof reviewer!=='string'||!reviewer.trim()||reviewer.length>100)return res.status(400).json({error:'Reviewer name is required.'});
 const q=getQuestion(candidate.questionId);if(!baseline(candidate.questionId))return res.status(400).json({error:'Only reported questions can be queued in this workspace.'});if(!q||!matchesQuestionHash(q,candidate.questionHash))return res.status(409).json({error:'Question changed since this assessment. Run the AI check again.'});
 if(state.decisions[q._id])return res.status(409).json({error:'Reopen this case before adding a proposal.'});
 if(latestAuditId(q._id)!==candidate.auditAtStart)return res.status(409).json({error:'The case was reviewed since this analysis. Run the AI check again.'});
 const nextState=structuredClone(state);const at=new Date().toISOString();
 // Even a model no-error conclusion is reviewed by a person before the case is closed.
 nextState.proposals[q._id]={...candidate.assessment,route:'faculty_review',source:'live_ai',proposalId:crypto.randomUUID(),model:candidate.model,provider:candidate.provider,generatedAt:candidate.generatedAt,questionHash:candidate.questionHash,validationWarning:candidate.warning};
 delete nextState.decisions[q._id];
 const event={id:crypto.randomUUID(),questionId:q._id,action:'queue_ai',actor:{method:'public_unverified'},reviewer:reviewer.trim(),note:'Live AI assessment queued for faculty review; no question change.',at,repair:candidate.assessment.repair,edit:null,before:null,after:null,source:'live_ai',proposalId:nextState.proposals[q._id].proposalId,proposal:structuredClone(nextState.proposals[q._id])};
 nextState.audit.unshift(event);
 try{await save(nextState);state=nextState}catch(e){return persistenceError(res,e,'Could not save the assessment.')}
 candidates.delete(candidateId);res.json({ok:true,event});
}));
app.post('/api/decisions',serialise(async(req,res)=>{
 const {questionId,action,edit,note,proposalId,questionHash:seenHash}=req.body,reviewer=req.body.reviewer;
 if(!['approve','edit','reject','defer','reopen','review_no_change'].includes(action)) return res.status(400).json({error:'Invalid action.'});
 if(typeof reviewer!=='string'||!reviewer.trim()||reviewer.length>100||typeof note!=='string'||note.length>1000) return res.status(400).json({error:'A reviewer name and a valid note are required.'});
 const current=getQuestion(questionId), result=assessment(questionId), decision=state.decisions[questionId];
 if(!current || !result)return res.status(400).json({error:'Case not found.'});
 if(proposalId!==result.proposalId)return res.status(409).json({error:'The proposal changed. Refresh and review the current version.'});
 if(action==='reopen'){
  if(!decision)return res.status(409).json({error:'This case is already open.'});
 } else {
  if(!['faculty_review','auto_apply'].includes(result.route)&&!['defer','review_no_change'].includes(action))return res.status(400).json({error:'This case is not awaiting faculty review.'});
  if(closed(decision))return res.status(409).json({error:'This case has already been reviewed. Refresh to see the latest state.'});
  if(decision?.action==='defer')return res.status(409).json({error:'Reopen this deferred case before taking another action.'});
 }
 if(['defer','review_no_change','reopen'].includes(action)&&!note.trim())return res.status(400).json({error:'Please add a note explaining this decision.'});
 if(result.source==='live_ai' && !matchesQuestionHash(current,result.questionHash) && action!=='reopen')return res.status(409).json({error:'The question changed since the AI assessment. Re-run the analysis.'});
 const changes=action==='approve'||action==='edit',chosen=action==='approve'?result.edit:edit;
 if(changes&&(!Object.hasOwn(req.body,'reviewVersion')||req.body.reviewVersion!==latestAuditId(questionId)||!matchesQuestionHash(current,seenHash)))return res.status(409).json({error:'The question or review history changed since it was opened. Refresh and review before applying a change.'});
 if(changes) { if(action==='edit' && (!result.edit || !chosen || chosen.field!==result.edit.field || JSON.stringify(chosen.find)!==JSON.stringify(result.edit.find)))return res.status(400).json({error:'An edit must keep the proposed field and exact original text.'}); const error=validateEdit(current,result.repair,chosen,taxonomy);if(error)return res.status(400).json({error}); }
 const before=changes?current[current.questionType][chosen.field]:null;
 const updated=changes?applyEdit(current,chosen):null;
 if(updated){const conflict=domainAnswerConflict(questions.find(q=>q._id===questionId),current,updated);if(conflict)return res.status(400).json({error:conflict})}
 const event={id:crypto.randomUUID(),questionId,action,actor:{method:'public_unverified'},reviewer:reviewer.trim(),note:note.trim(),at:new Date().toISOString(),repair:result.repair,edit:changes?chosen:null,before,after:updated?updated[updated.questionType][chosen.field]:null,source:result.source,proposalId:result.proposalId};
 const nextState=structuredClone(state);
 if(updated)nextState.questions[questionId]=updated;
 if(action==='reopen')delete nextState.decisions[questionId];else nextState.decisions[questionId]={action,reviewer:event.reviewer,at:event.at};
 nextState.audit.unshift(event);
 try{await save(nextState);state=nextState}catch(e){return persistenceError(res,e,'Could not persist the decision; the server could not confirm the write. Refresh before retrying.')}
 res.json({ok:true,event});
}));
// A preview is a short-lived server-side immutable snapshot. Only that exact preview can be saved.
const authoredPreviews=new Map();
app.post('/api/author/preview',serialise(async(req,res)=>{
 const {questionId,proposalId,questionHash,changes}=req.body;
 const current=getQuestion(questionId),result=assessment(questionId);
 if(!current||!result)return res.status(404).json({error:'Case not found.'});
 if(state.decisions[questionId])return res.status(409).json({error:'Reopen the case before authoring.'});
 if(result.proposalId!==proposalId||!matchesQuestionHash(current,questionHash))return res.status(409).json({error:'Question or proposal changed. Refresh and review again.'});
 if(result.source==='live_ai'&&!matchesQuestionHash(current,result.questionHash))return res.status(409).json({error:'AI assessment is stale; rerun it.'});
 let updated;try{updated=buildAuthoredQuestion(current,result,changes,taxonomy)}catch(e){return res.status(400).json({error:e.message})}
 const conflict=domainAnswerConflict(questions.find(q=>q._id===questionId),current,updated);if(conflict)return res.status(400).json({error:conflict});
 const now=Date.now();for(const [id,v] of authoredPreviews)if(v.expires<=now)authoredPreviews.delete(id);
 if(authoredPreviews.size>=100)authoredPreviews.delete(authoredPreviews.keys().next().value);
 const previewId=crypto.randomUUID();authoredPreviews.set(previewId,{questionId,proposalId,questionHash,auditAtPreview:latestAuditId(questionId),updated,changes:structuredClone(changes),expires:now+15*60*1000});
 const block=updated[updated.questionType];
 res.json({previewId,before:{question:safeMarkup(current[current.questionType].question),solution:safeMarkup(current[current.questionType].solution),answer:current[current.questionType].answer,questionType:current.questionType,chapter:current.chapter,diagramCount:Array.isArray(current[current.questionType].quesImages)?current[current.questionType].quesImages.length:0,diagrams:safeStoredDiagrams(current)},after:{question:safeMarkup(block.question),solution:safeMarkup(block.solution),answer:block.answer,questionType:updated.questionType,chapter:updated.chapter,diagramCount:Array.isArray(block.quesImages)?block.quesImages.length:0,diagrams:safeStoredDiagrams(updated)}});
}));
app.post('/api/author/commit',serialise(async(req,res)=>{
 const {previewId,note,attested,sourceDetails}=req.body,reviewer=req.body.reviewer,p=authoredPreviews.get(previewId);
 if(!p||p.expires<=Date.now())return res.status(410).json({error:'Preview expired. Preview the change again.'});
 if(typeof reviewer!=='string'||!reviewer.trim()||reviewer.length>100||typeof note!=='string'||!note.trim()||note.length>1000)return res.status(400).json({error:'Reviewer and a rationale are required.'});
 if(attested!==true)return res.status(400).json({error:'Confirm that you reviewed the change and have permission to use any supplied material.'});
 if('diagram' in p.changes && p.changes.diagram?.operation!=='remove' && (typeof sourceDetails!=='string'||sourceDetails.trim().length<5||sourceDetails.length>500))return res.status(400).json({error:'Describe the diagram source or state that you drew it yourself.'});
 const current=getQuestion(p.questionId),result=assessment(p.questionId);
 if(!current||!result||result.proposalId!==p.proposalId||!matchesQuestionHash(current,p.questionHash)||state.decisions[p.questionId]||latestAuditId(p.questionId)!==p.auditAtPreview)return res.status(409).json({error:'Case changed since preview. Refresh and review again.'});
 const next=structuredClone(state),at=new Date().toISOString();
 const event={id:crypto.randomUUID(),questionId:p.questionId,action:'author_fix',actor:{method:'public_unverified'},reviewer:reviewer.trim(),note:note.trim(),at,repair:result.repair,edit:{field:Object.keys(p.changes).join(', ')},before:current,after:p.updated,source:'faculty_authored',sourceDetails:typeof sourceDetails==='string'?sourceDetails.trim().slice(0,500):'',attestation:'Reviewer attested review and permission; identity and rights are not independently verified.',proposalId:p.proposalId};
 next.questions[p.questionId]=p.updated;next.decisions[p.questionId]={action:'author_fix',reviewer:event.reviewer,at};next.audit.unshift(event);
 try{await save(next);state=next;authoredPreviews.delete(previewId);res.json({ok:true,eventId:event.id})}catch(e){return persistenceError(res,e,'Could not persist this change; refresh before retrying.')}
}));
// Optional opt-in auto-run: a tiny pinned policy, not model confidence. Persist the
// question, decision and full before/after audit together, and never repeat after reopen.
async function runSafeAutoApply(actor={method:'automatic_startup'}) {
 const next=structuredClone(state), applied=[];
 for(const original of questions) {
  const id=original._id, result=baseline(id), current=next.questions[id] || original;
  if(next.decisions[id] || next.proposals[id] || next.audit.some(e=>e.questionId===id && e.action==='auto_apply')) continue;
  if(!autoEligible(current,original,result,taxonomy))continue;
  const updated=applyEdit(current,result.edit), at=new Date().toISOString();
  const event={id:crypto.randomUUID(),questionId:id,action:'auto_apply',actor,reviewer:'Automated policy',note:'Pinned low-risk spelling correction; no model confidence threshold used.',at,repair:result.repair,edit:result.edit,before:current[current.questionType][result.edit.field],after:updated[updated.questionType][result.edit.field],source:'precomputed',proposalId:'baseline:'+id};
  next.questions[id]=updated;next.decisions[id]={action:'auto_apply',reviewer:event.reviewer,at};next.audit.unshift(event);applied.push(id);
 }
 if(applied.length){await save(next);state=next;}
 return applied;
}
app.post('/api/auto-apply',serialise(async(req,res)=>{
 try {const applied=await runSafeAutoApply({method:'public_unverified'});res.json({ok:true,applied});}
 catch(e) {persistenceError(res,e,'Could not persist auto-applied fixes; no in-memory changes committed.');}
}));
if(process.env.AUTO_APPLY_SAFE==='true') {
 try {const applied=await runSafeAutoApply();console.log(`Safe auto-apply completed: ${applied.length} fixes.`)}
 catch(e){console.error('Safe auto-apply failed; server will not start:',e.message);process.exit(1)}
}
app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found.'}));
app.use((err,req,res,next)=>{
 if(!req.path.startsWith('/api'))return next(err);
 if(err.type==='entity.too.large')return res.status(413).json({error:'Request is too large.'});
 if(err.type==='entity.parse.failed')return res.status(400).json({error:'Malformed JSON request.'});
 console.error('API request failed:',err.name);return res.status(500).json({error:'The request could not be completed.'});
});
app.use(express.static(path.join(root,'public')));
app.get('*',(req,res)=>res.sendFile(path.join(root,'public/index.html')));
app.listen(process.env.PORT||3001,'0.0.0.0',()=>console.log('Faculty console listening on port '+(process.env.PORT||3001)));
