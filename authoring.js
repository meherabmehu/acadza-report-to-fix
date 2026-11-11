import {validateEdit} from './lib.js';
import {PNG} from 'pngjs';
import jpeg from 'jpeg-js';
import sanitizeHtml from 'sanitize-html';
// These permissions are for explicit faculty authorship, not AI patches or auto-apply.
// The supplied taxonomy lists no machine-editable fields for human-only categories.
export function authorFields(repair,taxonomy){
 const rules={identical_options:['question'],diagram:['diagram'],wrong_question:['question','solution','answer'],unsound:['question','solution','answer'],wrong_chapter:['chapter'],syllabus:[]};
 if(Object.hasOwn(rules,repair))return rules[repair];
 const fields=taxonomy.repairs[repair]?.fields||[];
 return [...new Set(fields.filter(x=>['question','solution','answer','questionType'].includes(x)))];
}
function validDiagram(value){
 if(typeof value!=='string'||value.length>210000)return false;
 const m=value.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/);if(!m)return false;
 const b=Buffer.from(m[2],'base64');if(b.length<12||b.length>150000||b.toString('base64')!==m[2])return false;
 try {
  if(m[1]==='png'){
   if(b.length<33||!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||b.toString('ascii',12,16)!=='IHDR')return false;
   const w=b.readUInt32BE(16),h=b.readUInt32BE(20);if(!w||!h||w>2048||h>2048||w*h>2000000||b[28]!==0)return false; // Reject interlaced PNG: the decoder's interlaced inflater is unbounded.
   const image=PNG.sync.read(b,{checkCRC:true});return image.width===w&&image.height===h;
  }
  if(b[0]!==255||b[1]!==216||b[2]!==255||b[b.length-2]!==255||b[b.length-1]!==217)return false;
  const image=jpeg.decode(b,{useTArray:true,maxResolutionInMP:2,maxMemoryUsageInMB:32});return image.width>0&&image.height>0&&image.width<=2048&&image.height<=2048&&image.width*image.height<=2000000;
 }catch{return false;}
}
export function buildAuthoredQuestion(current,assessment,changes,taxonomy){
 if(!current||assessment?.verdict!=='defect'||!Object.hasOwn(taxonomy.repairs,assessment.repair))throw Error('Only a reported defect can be authored.');
 if(!changes||typeof changes!=='object'||Array.isArray(changes))throw Error('Invalid changes.');
 const allowed=authorFields(assessment.repair,taxonomy), keys=Object.keys(changes);
 if(!keys.length||keys.some(k=>!allowed.includes(k)))throw Error('Change is outside the faculty authoring scope.');
 const result=structuredClone(current),oldType=current.questionType,old=current[oldType];if(!old)throw Error('Question type is invalid.');
 if('questionType' in changes){
  if(!['scq','mcq','integerQuestion'].includes(changes.questionType)||changes.questionType===oldType)throw Error('Choose a different valid question type.');
  if(!('answer' in changes))throw Error('A new answer is required for a type migration.');
  if(Object.hasOwn(result,changes.questionType))throw Error('Destination type already exists; manual investigation required.');
  result.questionType=changes.questionType;result[changes.questionType]=structuredClone(old);delete result[oldType];
 }
 const block=result[result.questionType];
 // Faculty authoring must not silently bypass a repair's original safety scope.
 if('question' in changes && ['option_repair','identical_options'].includes(assessment.repair)){
  const before=old.question,after=changes.question;
  if(typeof after!=='string')throw Error('Question must be text.');
  const marker=/\(A\)/;const b=before.search(marker),a=after.search(marker);
  if(b<0||a<0||before.slice(0,b)!==after.slice(0,a))throw Error('Option repair cannot change the question stem.');
  const text=sanitizeHtml(after,{allowedTags:[],allowedAttributes:{}}).replace(/\s+/g,' '),parts=[...text.matchAll(/\(([A-D])\)/g)];
  if(parts.length!==4||parts.some((m,i)=>m[1]!=='ABCD'[i]))throw Error('Provide exactly one option each for A, B, C and D in order.');
  const content=parts.map((m,i)=>text.slice(m.index+m[0].length,parts[i+1]?.index??text.length).trim());
  if(content.some(v=>!v))throw Error('Options cannot be blank.');
  if(assessment.repair==='identical_options'&&new Set(content.map(v=>v.toLowerCase())).size!==4)throw Error('Duplicate options must be made distinct.');
 }
 if(['spelling','answer_form','noise','exam_reference'].includes(assessment.repair))for(const field of ['question','solution'])if(field in changes){
  const before=old[field],after=changes[field];if(typeof before!=='string'||typeof after!=='string')throw Error('Invalid text change.');
  let start=0,endBefore=before.length,endAfter=after.length;
  while(start<endBefore&&start<endAfter&&before[start]===after[start])start++;
  while(endBefore>start&&endAfter>start&&before[endBefore-1]===after[endAfter-1]){endBefore--;endAfter--;}
  // Include one neighbouring character for pure additions so exact-find validation works.
  if(start===endBefore&&start>0)start--;
  const error=validateEdit(current,assessment.repair,{field,find:before.slice(start,endBefore),replace:after.slice(start,endAfter)},taxonomy);
  if(error)throw Error('Faculty edit violates repair scope: '+error);
 }
 for(const field of ['question','solution'])if(field in changes){
  const v=changes[field];if(typeof v!=='string'||!v.trim()||v.length>50000)throw Error(`${field} must be non-empty and at most 50,000 characters.`);
  if(/<\s*\/?\s*(?:script|iframe|object|embed|svg|img|style|link|meta|form|input|button)\b|\bon\w+\s*=|javascript\s*:|data\s*:/i.test(v))throw Error('Unsafe active content is not permitted.');
  block[field]=v;
 }
 if('answer' in changes){
  // validate against the edited question, not the old question; reset find to the old stored answer.
  const validationQuestion=structuredClone(result);validationQuestion[result.questionType].answer=old.answer;
  const error=validateEdit(validationQuestion,'answer_key',{field:'answer',find:old.answer,replace:changes.answer},taxonomy);
  if(error)throw Error(error);block.answer=changes.answer;
 }
 if('question' in changes && !('answer' in changes)){const err=validateEdit(result,'answer_key',{field:'answer',find:block.answer,replace:block.answer},taxonomy);if(err)throw Error('Check the answer against the authored question: '+err);}
 if('diagram' in changes){
  const spec=typeof changes.diagram==='string'?{operation:'add',data:changes.diagram}:changes.diagram;
  if(!spec||typeof spec!=='object'||Array.isArray(spec)||!['add','replace','remove'].includes(spec.operation))throw Error('Invalid diagram operation.');
  if(Object.keys(spec).some(k=>!['operation','index','data'].includes(k)))throw Error('Invalid diagram operation.');
  const images=[...(Array.isArray(block.quesImages)?block.quesImages:[])];
  if(spec.operation!=='add'&&(!Number.isInteger(spec.index)||spec.index<0||spec.index>=images.length))throw Error('Choose an existing diagram number.');
  if(spec.operation!=='remove'&&!validDiagram(spec.data))throw Error('Use a valid PNG or JPEG image under 150 KB.');
  if(spec.operation==='add'&&images.length>=5)throw Error('At most five diagrams are supported per question.');
  if(spec.operation==='add')images.push(spec.data);else if(spec.operation==='replace')images[spec.index]=spec.data;else images.splice(spec.index,1);
  block.quesImages=images;
 }
 if('chapter' in changes){const v=changes.chapter;if(typeof v!=='string'||!v.trim()||v.length>160||/[<>]/.test(v))throw Error('Enter a valid chapter name.');result.chapter=v.trim();}
 if(JSON.stringify(result)===JSON.stringify(current))throw Error('No change was made.');
 result.updatedAt=new Date().toISOString();return result;
}
export function safeStoredDiagrams(question){
 const block=question[question.questionType];return (Array.isArray(block?.quesImages)?block.quesImages:[]).filter(validDiagram);
}
