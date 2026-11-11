// Narrow, non-independent regression checks selected from known arithmetic cases.
// These expectations were authored during the same project and are NOT Acadza labels.
import fs from 'node:fs';
const checks=[
 ['R001','defect','answer_key','answer','A'],['R002','defect','answer_key','answer','A'],['R003','defect','answer_key','answer','A'],
 ['R004','defect','answer_key','answer','D'],['R005','defect','answer_key','answer','1'],
 ['R016','defect','solution_fix','solution','a = 20 cm'],['R034','defect','unsound',null,null],['R044','no_error',null,null,null]
];
const rows=JSON.parse(fs.readFileSync(process.argv[2]||'results.json','utf8'));let passed=0;
for(const [id,verdict,repair,field,replace] of checks){const r=rows.find(x=>x.reportId===id);const ok=!!r&&r.verdict===verdict&&(r.repair??null)===repair&&(field===null? !r.edit :r.edit?.field===field&&r.edit?.replace===replace);passed+=Number(ok);console.log(`${id}: ${ok?'matches':'differs'}`)}
console.log(`${passed}/${checks.length} report rows match narrow project-authored expectations (6 distinct questions).`);
console.log('Not independent, not held out, and NOT Acadza ground truth or a dataset accuracy estimate.');
if(passed!==checks.length)process.exitCode=1;
