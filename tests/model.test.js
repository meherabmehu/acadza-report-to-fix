import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareModelInput,checkModelAssessment} from '../model.js';
const load=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const q=load('data/questions.json').find(q=>q._id==='60f744b3f1b9bc7cc7b4a949'), taxonomy=load('data/taxonomy.json'), reports=load('data/reports.json');
const valid={verdict:'defect',repair:'answer_key',edit:{field:'answer',find:'C',replace:'A'},confidence:.9,evidence:'The answer is 50 V.',student_reply:'Thanks for reporting this; a teacher will review it.'};
test('model receives report content but not student identity',()=>{const x=prepareModelInput(q,reports.filter(r=>r.questionId===q._id),taxonomy);assert.equal(x.reports.length,3);assert.ok(x.reports.every(r=>!('studentId' in r)));});
test('valid model suggestions are always routed for review',()=>{const x=checkModelAssessment(valid,q,taxonomy);assert.equal(x.assessment.route,'faculty_review');assert.deepEqual(x.assessment.edit,valid.edit)});
test('invalid scope is discarded and malicious taxonomy labels are rejected',()=>{const x=checkModelAssessment({...valid,edit:{field:'question',find:'In',replace:'Modified'}},q,taxonomy);assert.equal(x.assessment.edit,null);assert.ok(x.warning);assert.throws(()=>checkModelAssessment({...valid,verdict:'toString'},q,taxonomy));assert.throws(()=>checkModelAssessment({...valid,verdict:'no_error'},q,taxonomy));});
test('faculty-only repairs cannot propose an edit',()=>{const x=checkModelAssessment({...valid,repair:'diagram',edit:{field:'question',find:'In',replace:'x'}},q,taxonomy);assert.equal(x.assessment.edit,null);assert.ok(x.warning)});

import {providerConfig} from '../provider.js';
test('Groq and OpenAI use separate endpoints and keys',()=>{const groq=providerConfig({GROQ_API_KEY:'groq-key'});assert.equal(groq.provider,'groq');assert.equal(groq.model,'openai/gpt-oss-120b');assert.equal(groq.key,'groq-key');assert.match(groq.url,/api\.groq\.com/);const openai=providerConfig({AI_PROVIDER:'openai',OPENAI_API_KEY:'openai-key'});assert.equal(openai.key,'openai-key');assert.match(openai.url,/api\.openai\.com/);assert.throws(()=>providerConfig({AI_PROVIDER:'unknown'}));});

test('unreviewed defect drafts cannot claim a fix has already been applied',()=>{const x=checkModelAssessment({...valid,student_reply:'We have fixed the answer already.'},q,taxonomy);assert.doesNotMatch(x.assessment.student_reply,/already|fixed|corrected|updated/i);assert.match(x.assessment.student_reply,/review/);});
test('unverified non-defect replies cannot claim changes were already made',()=>{
 const x=checkModelAssessment({...valid,verdict:'no_error',repair:null,edit:null,student_reply:'We have already fixed it.'},q,taxonomy);
 assert.doesNotMatch(x.assessment.student_reply,/already|fixed|corrected|updated/i);assert.match(x.assessment.student_reply,/preliminary/);
});
test('model input excludes image bytes and links but reports their presence',()=>{
 const input=structuredClone(q);input.scq.quesImages=['data:image/png;base64,PRIVATE'];input.scq.solutionImages=['https://example.org/private.png'];
 const sent=prepareModelInput(input,[],taxonomy);assert.deepEqual(sent.imageContext,{questionImageCount:1,solutionImageCount:1,imagesAvailableToModel:false});assert.equal(JSON.stringify(sent).includes('PRIVATE'),false);assert.equal(JSON.stringify(sent).includes('example.org'),false);assert.equal(input.scq.quesImages.length,1);
});
