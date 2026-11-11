import crypto from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
export function validateEdit(question, repair, edit, taxonomy) {
  if (!edit || typeof edit !== 'object') return 'No edit was proposed.';
  const rule = taxonomy.repairs[repair];
  if (!rule || !rule.fields.includes(edit.field)) return 'The edit touches a field outside the repair scope.';
  if (rule.auto === false) return 'This repair requires authored content and cannot be applied through the edit tool.';
  const block = question[question.questionType];
  if (!block || !(edit.field in block)) return 'This field cannot be safely edited in the current question type.';
  const old = block[edit.field];
  if (edit.field === 'answer') {
    if (JSON.stringify(old) !== JSON.stringify(edit.find)) return 'The answer has changed since this proposal was generated.';
    if (question.questionType === 'scq' && !['A','B','C','D'].includes(edit.replace)) return 'Single-choice answer must be A, B, C or D.';
    if (question.questionType === 'mcq' && (!Array.isArray(edit.replace) || !edit.replace.length || edit.replace.some(x => !['A','B','C','D'].includes(x)) || new Set(edit.replace).size !== edit.replace.length)) return 'Multiple-choice answers must be distinct option letters.';
    // Fail closed on missing, blank or ambiguous labels for both SCQ and MCQ.
    if (question.questionType === 'scq' || question.questionType === 'mcq') {
      const text=sanitizeHtml(block.question||'',{allowedTags:[],allowedAttributes:{}}).replace(/\s+/g,' ');
      const options=[...text.matchAll(/\(([A-D])\)/g)];
      for(const letter of (Array.isArray(edit.replace)?edit.replace:[edit.replace])) {
        const matches=options.map((m,i)=>({m,i})).filter(x=>x.m[1]===letter);
        if(matches.length!==1) return 'The proposed answer option is missing or ambiguous in the question.';
        const {m,i}=matches[0], end=options[i+1]?.index ?? text.length;
        if(!text.slice(m.index+m[0].length,end).trim()) return 'The proposed answer option is blank.';
      }
    }
    if (question.questionType === 'integerQuestion' && (typeof edit.replace !== 'string' || !/^-?\d+$/.test(edit.replace))) return 'Integer answers must be whole-number strings.';
  } else {
    if (typeof old !== 'string' || typeof edit.find !== 'string' || !edit.find || typeof edit.replace !== 'string') return 'Text edits require a non-empty find string and a replacement.';
    if (old.split(edit.find).length !== 2) return 'The find text must match exactly once in the current record.';
    if (edit.find.length > 10000 || edit.replace.length > 10000) return 'Edit exceeds the size limit.';
    if (/<\s*\/?\s*(?:script|iframe|object|embed|svg)\b|\bon\w+\s*=|javascript\s*:/i.test(edit.replace)) return 'Active content is not permitted in an edit.';
    if (repair==='spelling' && (!/^[A-Za-z\s'’-]+$/.test(edit.find) || !/^[A-Za-z\s'’-]+$/.test(edit.replace))) return 'Spelling repairs may change words only, not numbers, symbols or markup.';
    if (repair==='answer_form') { let i=0; while(i<edit.find.length && edit.find[i]===edit.replace[i]) i++; const added=edit.replace.length-edit.find.length; if(added<0 || edit.replace.slice(i+added)!==edit.find.slice(i)) return 'Answer-form edits must be a single additive insertion preserving the original text.'; }
    if (repair==='noise' && edit.replace!=='') return 'Noise edits can only remove stray text.';
    if (repair==='exam_reference' && edit.replace!=='') return 'Exam-reference edits can only remove the reference.';
    if (repair==='option_repair') {
      const position=old.indexOf(edit.find);
      const markers=[...old.matchAll(/\([A-D]\)/g)];
      const preceding=markers.filter(m=>m.index<=position).at(-1);
      const next=markers.find(m=>m.index>position);
      if(!preceding || (next && position+edit.find.length>next.index)) return 'Option edits must stay within one identifiable option; the stem cannot change.';
      const labels=x=>[...x.matchAll(/\([A-D]\)/g)].map(m=>m[1]);
      if(JSON.stringify(labels(edit.find))!==JSON.stringify(labels(edit.replace))) return 'Option edits cannot add, remove or change option labels.';
    }
  }
  return null;
}
export function applyEdit(question, edit) {
 const q=structuredClone(question), b=q[q.questionType];
 b[edit.field] = edit.field === 'answer' ? edit.replace : b[edit.field].replace(edit.find, edit.replace);
 q.updatedAt = new Date().toISOString(); return q;
}
export function secureEqual(a,b) { const x=Buffer.from(a),y=Buffer.from(b); return x.length===y.length && crypto.timingSafeEqual(x,y); }
