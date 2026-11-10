/*---
description: Ported from TypeScript's tests/cases/compiler/functionCall4.ts.
outcome: success
source: tests/cases/compiler/functionCall4.ts
---*/
// @target: es2015
function foo():any{return ""}; 
function bar():()=>any{return foo}; 
var x = bar();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
