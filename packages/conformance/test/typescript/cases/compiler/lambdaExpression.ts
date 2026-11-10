/*---
description: Ported from TypeScript's tests/cases/compiler/lambdaExpression.ts.
outcome: success
source: tests/cases/compiler/lambdaExpression.ts
---*/
// @target: es2015
() => 0; // Needs to be wrapped in parens to be a valid expression (not declaration)
var y = 0;
(()=>0);
var x = 0;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
