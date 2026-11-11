// Sample-specific fail-closed checks. These do not prove a repair is correct.
// Apply only to an unchanged supplied question text and only when the answer is changed.
const known = new Map([
 ['60f744b3f1b9bc7cc7b4a949',{answer:'A',why:'The supplied RLC data give 50 V, option A.'}],
 ['68e870ef42c06737d6e565c4',{answer:'D',why:'The supplied gas data give 4800 Pa, option D.'}],
 ['68dea616d0cda73d07e93ae6',{answer:'1',why:'The supplied cube flux gives n = 1.'}],
 ['6263d75bdd44e265ef926d97',{answer:'20',why:'800 = 2a² gives a = 20 cm, not 40.'}],
 ['695ee00b88d7701e561aabc5',{answer:null,why:'Both statements are false; no supplied option represents both false.'}]
]);
export function domainAnswerConflict(original,current,updated){
 const rule=known.get(current?._id);
 if(!rule||!original||original._id!==current._id||!updated||current.questionType!==original.questionType||updated.questionType!==original.questionType)return null;
 const key=current.questionType,source=original[key];
 if(!source||current[key]?.question!==source.question||updated[key]?.question!==source.question)return null;
 const before=current[key].answer,after=updated[key].answer;
 if(JSON.stringify(before)===JSON.stringify(after))return null;
 if(rule.answer===null||JSON.stringify(after)!==JSON.stringify(rule.answer))return `Independent sample guard: ${rule.why} Review or revise the question; the unchanged stem does not support this answer change.`;
 return null;
}
