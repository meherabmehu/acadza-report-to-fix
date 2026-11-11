// Compare two result files without modifying either. Model claims remain unverified.
import fs from 'node:fs';
const basePath=process.argv[2]||'results.json', modelPath=process.argv[3]||'results.llm.json';
try {
 const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const baseline=load(basePath), model=load(modelPath), reports=load('data/reports.json');
 if(!Array.isArray(baseline)||!Array.isArray(model))throw Error('Both files must contain arrays.');
 const unique=(rows,label)=>{const m=new Map();for(const r of rows){if(!r.reportId||m.has(r.reportId))throw Error(`${label} has a missing or duplicate reportId.`);m.set(r.reportId,r)}return m};
 const a=unique(baseline,'Baseline'),b=unique(model,'Model output');
 const ids=new Set(reports.map(r=>r.reportId));
 if(a.size!==ids.size||b.size!==ids.size||[...ids].some(id=>!a.has(id)||!b.has(id)))throw Error('Result files must each contain exactly one entry for every supplied report.');
 let different=0,replyFlags=0;
 for(const report of reports){
  const old=a.get(report.reportId), now=b.get(report.reportId);
  if(old.questionId!==report.questionId||now.questionId!==report.questionId)throw Error(`Question ID mismatch for ${report.reportId}.`);
  const differences=['verdict','repair','route'].filter(k=>JSON.stringify(old[k]??null)!==JSON.stringify(now[k]??null));
  if(differences.length){different++;console.log(`${report.reportId}: ${differences.map(k=>`${k}: ${old[k]??'null'} → ${now[k]??'null'}`).join('; ')}`)}
  const reply=String(now.student_reply||'');
  if(now.route==='faculty_review' && (/\b(?:has been|have been|we(?:'ve| have)|i(?:'ve| have))\s+(?:already\s+)?(?:fixed|updated|corrected|added|changed|applied)\b/i.test(reply) || /\badded\s+it\s+to\s+the\s+question\b/i.test(reply))){replyFlags++;console.log(`${report.reportId}: REVIEW REPLY — may claim a change was already applied.`)}
 }
 console.log(`\n${ids.size} reports checked; ${different} differ in verdict, repair or route; ${replyFlags} possible premature-fix replies.`);
 console.log('These are review flags, not ground truth. Edits, reasoning and mathematical accuracy still require independent checks. Neither file was changed.');
}catch(e){console.error('Comparison failed:',e.message);process.exitCode=1}
