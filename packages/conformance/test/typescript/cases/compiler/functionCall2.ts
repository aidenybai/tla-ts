/*---
description: Ported from TypeScript's tests/cases/compiler/functionCall2.ts.
outcome: success
source: tests/cases/compiler/functionCall2.ts
---*/
// @target: es2015
function foo():number{return 1}; 
var x = foo();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
