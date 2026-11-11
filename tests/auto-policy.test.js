import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {autoEligible} from '../auto-policy.js';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const qs=load('data/questions.json'), rs=load('results.json'), tax=load('data/taxonomy.json');
test('auto policy only permits exact pinned unchanged spelling patches',()=>{
 for(const reportId of ['R012','R022']) {
  const r=rs.find(x=>x.reportId===reportId),q=qs.find(x=>x._id===r.questionId);
  assert.equal(autoEligible(q,q,r,tax),true);
  assert.equal(autoEligible({...q,chapter:'changed'},q,r,tax),false);
  assert.equal(autoEligible(q,q,{...r,edit:{...r.edit,replace:'different'}},tax),false);
  assert.equal(autoEligible(q,q,{...r,repair:'diagram'},tax),false);
  const noauto=structuredClone(tax);noauto.repairs.spelling.auto=false;assert.equal(autoEligible(q,q,r,noauto),false);
 }
 const r=rs.find(x=>x.reportId==='R001'),q=qs.find(x=>x._id===r.questionId);
 assert.equal(autoEligible(q,q,{...r,route:'auto_apply'},tax),false);
});
