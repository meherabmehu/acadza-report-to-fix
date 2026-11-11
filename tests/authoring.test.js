import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {authorFields,buildAuthoredQuestion,safeStoredDiagrams} from '../authoring.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));const qs=read('data/questions.json'),rs=read('results.json'),taxonomy=read('data/taxonomy.json');
const by=id=>{const r=rs.find(x=>x.reportId===id);return [qs.find(x=>x._id===r.questionId),r]};
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4AWP4DwQACfsD/c8LaHIAAAAASUVORK5CYII=';
test('faculty authors missing option or duplicate option without changing other fields',()=>{
 const [q,r]=by('R009');const html=q.scq.question.replace('</h3>','<br/>(D) 5 m/s</h3>');const out=buildAuthoredQuestion(q,r,{question:html},taxonomy);assert.match(out.scq.question,/\(D\) 5 m\/s/);assert.equal(q.scq.question.includes('(D)'),false);assert.equal(out.scq.answer,q.scq.answer);
 const [q2,r2]=by('R015');assert.deepEqual(authorFields(r2.repair,taxonomy),['question']);assert.throws(()=>buildAuthoredQuestion(q2,r2,{answer:'D'},taxonomy),/scope/);
});
test('diagram accepts only bounded raster data and never changes question answer',()=>{
 const [q,r]=by('R025');const out=buildAuthoredQuestion(q,r,{diagram:png},taxonomy);assert.equal(safeStoredDiagrams(out)[0],png);assert.deepEqual(q.scq.quesImages,[]);assert.equal(out.scq.answer,q.scq.answer);
 const existing=structuredClone(out);existing.scq.quesImages=['https://example.org/old.png'];const replaced=buildAuthoredQuestion(existing,r,{diagram:{operation:'replace',index:0,data:png}},taxonomy);assert.equal(safeStoredDiagrams(replaced).length,1);const removed=buildAuthoredQuestion(replaced,r,{diagram:{operation:'remove',index:0}},taxonomy);assert.deepEqual(removed.scq.quesImages,[]);assert.throws(()=>buildAuthoredQuestion(q,r,{diagram:{operation:'remove',index:99}},taxonomy),/existing diagram/);
 for(const bad of ['https://example.com/a.png','data:image/svg+xml;base64,PHN2Zy8+','data:image/png;base64,QUJDREVGR0hJSktM','data:image/png;base64,'+'A'.repeat(210001)])assert.throws(()=>buildAuthoredQuestion(q,r,{diagram:bad},taxonomy),/PNG or JPEG/);
});
test('faculty migration requires valid destination answer and maintains question and solution',()=>{
 const [q,r]=by('R021');assert.throws(()=>buildAuthoredQuestion(q,r,{questionType:'scq'},taxonomy),/answer/);
 const out=buildAuthoredQuestion(q,r,{questionType:'scq',answer:'B'},taxonomy);assert.equal(out.questionType,'scq');assert.equal(out.scq.answer,'B');assert.equal(out.scq.question,q.mcq.question);assert.equal(out.mcq,undefined);
 assert.throws(()=>buildAuthoredQuestion(q,r,{questionType:'scq',answer:'Z'},taxonomy),/answer/);
});
test('faculty authors a chapter and unsound question but rejects script and out-of-scope writes',()=>{
 const [q,r]=by('R042');const out=buildAuthoredQuestion(q,r,{chapter:'Electromagnetic Waves'},taxonomy);assert.equal(out.chapter,'Electromagnetic Waves');assert.match(q.chapter,/Geometrical optics/);assert.throws(()=>buildAuthoredQuestion(q,r,{question:'X'},taxonomy),/scope/);
 const [u,ur]=by('R034');assert.throws(()=>buildAuthoredQuestion(u,ur,{solution:'<script>alert(1)</script>'},taxonomy),/Unsafe/);assert.throws(()=>buildAuthoredQuestion(u,ur,{question:u.scq.question.replace('(D)','(E)')},taxonomy),/answer|option/i);
});
test('faculty option edits cannot rewrite the stem, omit choices, leave blanks or duplicates',()=>{
 const [q,r]=by('R009'),fixed=q.scq.question.replace('</h3>','<br/>(D) 5 m/s</h3>');
 assert.throws(()=>buildAuthoredQuestion(q,r,{question:fixed.replace('10 kg','99 kg')},taxonomy),/stem/);
 assert.throws(()=>buildAuthoredQuestion(q,r,{question:q.scq.question+' revised'},taxonomy),/exactly one option/);
 const [q2,r2]=by('R015');assert.throws(()=>buildAuthoredQuestion(q2,r2,{question:q2.scq.question.replace('(A) 200 W','(A) 201 W')},taxonomy),/Duplicate/);
 assert.throws(()=>buildAuthoredQuestion(q2,r2,{question:q2.scq.question.replace('(C) 0 W','(C) ')},taxonomy),/blank/);
});
test('faculty spelling and answer-form edits cannot alter values or unrelated content',()=>{
 const [q,r]=by('R012');assert.throws(()=>buildAuthoredQuestion(q,r,{question:q.scq.question.replace('Epithellial tisue','Epithelial tissue 10')},taxonomy),/scope|Spelling/);
 const corrected=buildAuthoredQuestion(q,r,{question:q.scq.question.replace('Epithellial tisue','Epithelial tissue')},taxonomy);assert.match(corrected.scq.question,/Epithelial tissue/);
 const [u,ur]=by('R024');assert.throws(()=>buildAuthoredQuestion(u,ur,{question:u.integerQuestion.question.replace('100','1000')},taxonomy),/scope|Answer.form/);
});
test('invalid image with valid signature is rejected and decompression dimensions are bounded',()=>{
 const [q,r]=by('R025');let fake=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(30)]);assert.throws(()=>buildAuthoredQuestion(q,r,{diagram:'data:image/png;base64,'+fake.toString('base64')},taxonomy),/valid PNG/);
 let bomb=Buffer.from(png.split(',')[1],'base64');bomb.writeUInt32BE(100000,16);assert.throws(()=>buildAuthoredQuestion(q,r,{diagram:'data:image/png;base64,'+bomb.toString('base64')},taxonomy),/valid PNG/);
});
test('a genuine JPEG decodes and a truncated JPEG is rejected',async()=>{
 const {default:jpeg}=await import('jpeg-js');const [q,r]=by('R025');const data=Buffer.from(jpeg.encode({data:Buffer.from([255,0,0,255]),width:1,height:1},80).data);const valid='data:image/jpeg;base64,'+data.toString('base64');
 assert.equal(safeStoredDiagrams(buildAuthoredQuestion(q,r,{diagram:valid},taxonomy))[0],valid);
 const bad=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(15),Buffer.from([255,217])]);assert.throws(()=>buildAuthoredQuestion(q,r,{diagram:'data:image/jpeg;base64,'+bad.toString('base64')},taxonomy),/valid PNG/);
});
test('interlaced PNG is rejected before decoding to avoid unbounded inflation',()=>{
 const [q,r]=by('R025');const b=Buffer.from(png.split(',')[1],'base64');b[28]=1;
 assert.throws(()=>buildAuthoredQuestion(q,r,{diagram:'data:image/png;base64,'+b.toString('base64')},taxonomy),/valid PNG/);
});
