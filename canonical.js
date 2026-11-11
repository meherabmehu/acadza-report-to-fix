import crypto from 'node:crypto';
// JSONB does not preserve object key order. Hash semantic JSON with sorted object keys.
export function canonicalJSON(value){
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonicalJSON).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalJSON(value[k])).join(',')+'}';
}
export const questionHash=q=>crypto.createHash('sha256').update(canonicalJSON(q)).digest('hex');
export const legacyQuestionHash=q=>crypto.createHash('sha256').update(JSON.stringify(q)).digest('hex');
export const matchesQuestionHash=(q,hash)=>hash===questionHash(q)||hash===legacyQuestionHash(q);
