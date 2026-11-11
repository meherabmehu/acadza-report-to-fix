import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {domainAnswerConflict} from '../domain-checks.js';
const qs=JSON.parse(fs.readFileSync('data/questions.json','utf8'));const cases=[['60f744b3f1b9bc7cc7b4a949','B','A'],['68e870ef42c06737d6e565c4','C','D'],['68dea616d0cda73d07e93ae6','3','1'],['6263d75bdd44e265ef926d97','40','20'],['695ee00b88d7701e561aabc5','C',null]];
test('sample numerical guard blocks known harmful answer changes but not a revised stem',()=>{
 for(const [id,bad,good] of cases){let q=qs.find(x=>x._id===id),changed=structuredClone(q);changed[changed.questionType].answer=bad;assert.match(domainAnswerConflict(q,q,changed)||'',/Independent sample guard/,id);if(good!==null){changed[changed.questionType].answer=good;assert.equal(domainAnswerConflict(q,q,changed),null)}changed[changed.questionType].question+=' Edited.';assert.equal(domainAnswerConflict(q,q,changed),null)}
});
