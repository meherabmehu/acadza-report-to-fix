// Model output is untrusted; keep it separate from the stored question and review decisions.
import {validateEdit} from './lib.js';
export function imageContext(question){
 const b=question[question.questionType]||{};
 return {questionImageCount:Array.isArray(b.quesImages)?b.quesImages.length:0,solutionImageCount:Array.isArray(b.solutionImages)?b.solutionImages.length:0,imagesAvailableToModel:false};
}
export function prepareModelInput(question,reports,taxonomy){
 const context=imageContext(question),copy=structuredClone(question),block=copy[copy.questionType];
 if(block){delete block.quesImages;delete block.solutionImages;}
 return {question:copy,imageContext:context,reports:reports.map(({reportId,questionId,source,reportedAt,comment})=>({reportId,questionId,source,reportedAt,comment})),taxonomy};
}
export function checkModelAssessment(out,question,taxonomy){
 if(!out || typeof out!=='object' || !Object.hasOwn(taxonomy.verdicts,out.verdict)) throw Error('Invalid model verdict.');
 if(typeof out.evidence!=='string'||!out.evidence.trim()||typeof out.student_reply!=='string'||!out.student_reply.trim()) throw Error('Missing model evidence or student reply.');
 if(typeof out.confidence!=='number'||!Number.isFinite(out.confidence)||out.confidence<0||out.confidence>1) throw Error('Invalid model confidence.');
 if(out.verdict==='defect'&&(!out.repair||!Object.hasOwn(taxonomy.repairs,out.repair))) throw Error('Defects require a valid repair type.');
 if(out.verdict!=='defect'&&(out.repair||out.edit)) throw Error('Non-defects cannot carry repairs or edits.');
 const warning=out.edit?validateEdit(question,out.repair,out.edit,taxonomy):null;
 // A model proposal is not an applied fix. Use a truthful draft until a human decides.
 const reply=out.verdict==='defect' ? 'Thanks for reporting this. There may be an issue that needs faculty review before any change is made.' : 'Thanks for reporting this. The assessment is preliminary, and a reviewer can check the details.';
 return {assessment:{verdict:out.verdict,repair:out.repair||null,edit:warning?null:out.edit||null,confidence:out.confidence,evidence:out.evidence.slice(0,2000),student_reply:reply,route:out.verdict==='defect'?'faculty_review':'no_change'},warning};
}
