/*---
description: Ported from TypeScript's tests/cases/compiler/functionCall3.ts.
outcome: success
source: tests/cases/compiler/functionCall3.ts
---*/
// @target: es2015
function foo():any[]{return [1];} 
var x = foo();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
