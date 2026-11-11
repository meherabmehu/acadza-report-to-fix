// Narrow, pinned allowlist: never infer safety from a model confidence score.
import {validateEdit} from './lib.js';
const allowed = new Map([
 ['61dffbec08489156b684bd22', {field:'question',find:'Epithellial tisue',replace:'Epithelial tissue'}],
 ['61ee6c9d90a1a968a168686b', {field:'question',find:'plexux',replace:'plexus'}]
]);
export function autoEligible(question, original, result, taxonomy) {
 if (!question || !original || !result || question._id !== original._id || result.questionId !== question._id) return false;
 if (result.route !== 'auto_apply' || result.verdict !== 'defect' || result.repair !== 'spelling' || taxonomy.repairs.spelling?.auto !== true) return false;
 const expected=allowed.get(question._id), edit=result.edit;
 if (!expected || !edit || Object.keys(edit).length!==3 || Object.keys(expected).some(k=>edit[k]!==expected[k])) return false;
 if (JSON.stringify(question)!==JSON.stringify(original)) return false;
 return !validateEdit(question,result.repair,edit,taxonomy);
}
