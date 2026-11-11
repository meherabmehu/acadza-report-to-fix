// Loaded only in the model integration test, never in the application runtime.
const original=globalThis.fetch;
let calls=0;
globalThis.fetch=async (url, options)=>{
 if(['https://api.openai.com/v1/chat/completions','https://api.groq.com/openai/v1/chat/completions'].includes(String(url))){
  calls++;
  if(process.env.MOCK_RATE_LIMIT_ONCE==='1' && calls===1) return new Response(JSON.stringify({error:{message:'rate limit'}}),{status:429,headers:{'retry-after':'0'}});
  if(process.env.MOCK_RATE_LIMIT_ALWAYS==='1') return new Response('{}',{status:429,headers:{'retry-after':'180'}});
  if(process.env.MOCK_INVALID_ONCE==='1' && calls===1) return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({verdict:'no_error',repair:'spelling',edit:null,confidence:0.8,evidence:'Possible spelling issue.',student_reply:'Thanks for reporting.'})}}]}),{status:200,headers:{'Content-Type':'application/json'}});
  const body=JSON.parse(options.body);
  const input=JSON.parse(body.messages[1].content);
  if(body.messages[0].content.includes('independent JEE/NEET question solver')) {
    if(input.answer!==undefined || input.solution!==undefined || input.reports!==undefined) throw Error('Independent solver received hidden context.');
    return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'A',reasoning:'The voltage is 50 V.',uncertainty:'none'})}}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(input.reports.some(r=>'studentId' in r)) throw Error('Student ID was not removed.');
  if(process.env.MOCK_BAD_ANSWER==='1')return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({verdict:'defect',repair:'answer_key',edit:{field:'answer',find:'20',replace:'40'},confidence:0.99,evidence:'Erroneous calculation.',student_reply:'Thanks for reporting.'})}}]}),{status:200,headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({verdict:'defect',repair:'answer_key',edit:{field:'answer',find:'C',replace:'A'},confidence:0.9,evidence:'The phasor result is 50 V.',student_reply:'Thanks for reporting this; a teacher will review it.'})}}]}),{status:200,headers:{'Content-Type':'application/json'}});
 }
 return original(url,options);
};
