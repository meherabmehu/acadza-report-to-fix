import test from 'node:test';import assert from 'node:assert/strict';import {questionHash,matchesQuestionHash,legacyQuestionHash} from '../canonical.js';
test('question hash survives PostgreSQL JSONB key reordering but detects content change',()=>{
 const a={z:1,b:{z:3,a:4},arr:[{y:2,x:1}]},b={arr:[{x:1,y:2}],b:{a:4,z:3},z:1};
 assert.equal(questionHash(a),questionHash(b));assert.notEqual(legacyQuestionHash(a),legacyQuestionHash(b));assert.ok(matchesQuestionHash(a,legacyQuestionHash(a)));b.arr[0].x=2;assert.notEqual(questionHash(a),questionHash(b));
});
