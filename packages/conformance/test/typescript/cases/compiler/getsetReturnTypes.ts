/*---
description: Ported from TypeScript's tests/cases/compiler/getsetReturnTypes.ts.
outcome: success
source: tests/cases/compiler/getsetReturnTypes.ts
---*/
// @target: es2015
function makePoint(x: number) { 
 return { 
  get x() { return x; } 
 } 
}; 
var x = makePoint(2).x;
var y: number = makePoint(2).x;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
