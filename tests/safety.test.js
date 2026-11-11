import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateEdit,applyEdit} from '../lib.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const qs=read('data/questions.json'),rs=read('data/reports.json'),results=read('results.json'),taxonomy=read('data/taxonomy.json');
test('every supplied report has exactly one assessment',()=>{assert.equal(rs.length,44);assert.equal(results.length,44);assert.deepEqual([...results.map(x=>x.reportId)].sort(),[...rs.map(x=>x.reportId)].sort());});
test('taxonomy, references, routes and proposed edits are valid',()=>{for(const x of results){assert.ok(taxonomy.verdicts[x.verdict]);assert.ok(['auto_apply','faculty_review','no_change'].includes(x.route));assert.ok(x.confidence>=0&&x.confidence<=1);assert.ok(x.student_reply);assert.ok(rs.some(r=>r.reportId===x.reportId&&r.questionId===x.questionId));if(x.repair)assert.ok(taxonomy.repairs[x.repair]);if(x.edit){const q=qs.find(q=>q._id===x.questionId);assert.equal(validateEdit(q,x.repair,x.edit,taxonomy),null,`${x.reportId} invalid`)} if(x.repair&&taxonomy.repairs[x.repair].auto===false) assert.notEqual(x.route,'auto_apply');}});
test('refuses an edit outside scope or without an exact unique match',()=>{const q=qs.find(q=>q._id==='60f744b3f1b9bc7cc7b4a949');assert.ok(validateEdit(q,'spelling',{field:'answer',find:'C',replace:'A'},taxonomy));assert.ok(validateEdit(q,'answer_key',{field:'answer',find:'B',replace:'A'},taxonomy));assert.ok(validateEdit(q,'diagram',{field:'question',find:'In',replace:'x'},taxonomy));assert.ok(validateEdit(q,'spelling',{field:'question',find:'a',replace:'x'},taxonomy));});
test('applying an answer proposal changes a copy only',()=>{const q=qs.find(q=>q._id==='60f744b3f1b9bc7cc7b4a949');const e={field:'answer',find:'C',replace:'A'};const changed=applyEdit(q,e);assert.equal(q.scq.answer,'C');assert.equal(changed.scq.answer,'A')});
test('hostile student comment is not followed in supplied assessment',()=>{let r=results.find(r=>r.reportId==='R027');assert.equal(r.verdict,'no_error');assert.equal(r.edit,null);assert.equal(r.route,'no_change')});
test('repair-specific rules prevent harmful edits within otherwise allowed fields',()=>{
 const q=qs.find(q=>q._id==='61dffbec08489156b684bd22');
 assert.ok(validateEdit(q,'spelling',{field:'question',find:'Epithellial tisue',replace:'Epithelial tissue 10'},taxonomy));
 assert.ok(validateEdit(q,'option_repair',{field:'question',find:'Which tissue is present',replace:'Which tissue is absent'},taxonomy));
 assert.ok(validateEdit(q,'spelling',{field:'question',find:'Epithellial tisue',replace:'<script>alert(1)</script>'},taxonomy));
 const unit=qs.find(q=>q._id==='5fc60508028950133eac8963');
 assert.ok(validateEdit(unit,'answer_form',{field:'question',find:'Then the frictional force is equal to',replace:'The answer is 10 N'},taxonomy));
 const missing=qs.find(q=>q._id==='68e872546e45ba37dcc16bc0');
 assert.ok(validateEdit(missing,'answer_key',{field:'answer',find:'C',replace:'C'},taxonomy));
});
test('an exam reference cannot be replaced by unrelated text',()=>{
 const q=qs.find(q=>q._id==='617fa18efd53ff1629ed890f');assert.ok(validateEdit(q,'exam_reference',{field:'question',find:'(NEET 2019) ',replace:'(Other 2020) '},taxonomy));
});
test('option repair cannot insert another answer label',()=>{
 const q=qs.find(q=>q._id==='68e872546e45ba37dcc16bc0');assert.ok(validateEdit(q,'option_repair',{field:'question',find:'(C) <br />',replace:'(C) 1:1<br />(A) replacement'},taxonomy));
});
test('noise cannot be used to rewrite text',()=>{
 const q=qs.find(q=>q._id==='61dffbec08489156b684bd22');assert.ok(validateEdit(q,'noise',{field:'question',find:'Epithellial tisue',replace:'different words'},taxonomy));
});
test('spelling repair cannot change a Greek mathematical symbol',()=>{
 const q=structuredClone(qs.find(q=>q._id==='61dffbec08489156b684bd22'));q.scq.question+=' π';assert.ok(validateEdit(q,'spelling',{field:'question',find:'π',replace:'σ'},taxonomy));
});
test('MCQ answer edits reject missing, blank or ambiguous options',()=>{
 const q={questionType:'mcq',mcq:{question:'(A) one (B) two (C) (D) four',answer:['A']}};
 assert.equal(validateEdit(q,'answer_key',{field:'answer',find:['A'],replace:['A','D']},taxonomy),null);
 assert.ok(validateEdit(q,'answer_key',{field:'answer',find:['A'],replace:['C']},taxonomy));
 q.mcq.question='(A) one (B) two';assert.ok(validateEdit(q,'answer_key',{field:'answer',find:['A'],replace:['D']},taxonomy));
 q.mcq.question='(A) one (A) other (B) two';assert.ok(validateEdit(q,'answer_key',{field:'answer',find:['A'],replace:['A']},taxonomy));
});
test('student reply drafts explain the key result without claiming an unreviewed fix',()=>{
 for(const x of results.filter(x=>x.route==='faculty_review')){
  assert.doesNotMatch(x.student_reply,/\b(?:has been|have been|we(?:'ve| have))\s+(?:already\s+)?(?:fixed|updated|corrected|added|changed|applied)\b/i,x.reportId);
  assert.doesNotMatch(x.student_reply,/\badded it to the question\b/i,x.reportId);
 }
 const reply=id=>results.find(x=>x.reportId===id).student_reply;
 assert.match(reply('R044'),/14 V/);assert.match(reply('R027'),/5\.7/);assert.match(reply('R033'),/3113/);
 for(const x of results)assert.doesNotMatch(x.student_reply,/\.\./,x.reportId);
});
