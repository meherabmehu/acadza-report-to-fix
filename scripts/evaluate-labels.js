// Evaluate only a complete supplied reference file; this tool does not attest its provenance.
import fs from 'node:fs';
try{
 const labelFile=process.argv[2],predictionFile=process.argv[3]||'results.json';if(!labelFile)throw Error('Usage: node scripts/evaluate-labels.js <reference-labels.json> [results.json]');
 const load=f=>JSON.parse(fs.readFileSync(f,'utf8')),reports=load('data/reports.json'),taxonomy=load('data/taxonomy.json');
 const map=(data,name)=>{if(!Array.isArray(data))throw Error(`${name} must be an array`);const out=new Map();for(const row of data){if(!row||typeof row.reportId!=='string'||out.has(row.reportId))throw Error(`${name} has a missing or duplicate reportId`);out.set(row.reportId,row)}return out};
 const labels=map(load(labelFile),'Reference'),predictions=map(load(predictionFile),'Predictions');
 if(labels.size!==reports.length||predictions.size!==reports.length)throw Error('Both files must contain all supplied reports exactly once');
 let verdict=0,joint=0,tp=0,fp=0,fn=0;const mismatches=[],groups=new Map();
 for(const report of reports){const a=labels.get(report.reportId),b=predictions.get(report.reportId);if(!a||!b||a.questionId!==report.questionId||b.questionId!==report.questionId)throw Error(`Missing or mismatched question ID for ${report.reportId}`);
  for(const [name,r] of [['Reference',a],['Prediction',b]]){if(!Object.hasOwn(taxonomy.verdicts,r.verdict))throw Error(`${name} has invalid verdict for ${report.reportId}`);if(r.verdict==='defect'?!Object.hasOwn(taxonomy.repairs,r.repair):r.repair!=null)throw Error(`${name} has invalid repair for ${report.reportId}`)}
  const v=a.verdict===b.verdict,j=v&&(a.repair??null)===(b.repair??null);verdict+=v;joint+=j;const group=groups.get(report.questionId)||{n:0,v:0,j:0};group.n++;group.v+=v;group.j+=j;groups.set(report.questionId,group);if(!j)mismatches.push(report.reportId);if(a.verdict==='defect'&&b.verdict==='defect')tp++;if(a.verdict!=='defect'&&b.verdict==='defect')fp++;if(a.verdict==='defect'&&b.verdict!=='defect')fn++;
 }
 const ratio=(n,d)=>d?+(n/d).toFixed(4):null;const macro=key=>ratio([...groups.values()].reduce((sum,g)=>sum+g[key]/g.n,0),groups.size);
 console.log(JSON.stringify({reference:labelFile,predictions:predictionFile,reportRows:reports.length,distinctQuestions:new Set(reports.map(r=>r.questionId)).size,verdictMatches:verdict,jointVerdictRepairMatches:joint,verdictAgreement:ratio(verdict,reports.length),jointAgreement:ratio(joint,reports.length),questionWeightedVerdictAgreement:macro('v'),questionWeightedJointAgreement:macro('j'),defect:{tp,fp,fn,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn)},mismatches,warning:'Only as valid as the supplied reference; repeated questions mean report rows are not independent. Edits and replies are not scored.'},null,2));
}catch(e){console.error('Evaluation failed:',e.message);process.exitCode=1}
