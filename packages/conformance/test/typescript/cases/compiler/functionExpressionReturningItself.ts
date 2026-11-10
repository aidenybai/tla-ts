/*---
description: Ported from TypeScript's tests/cases/compiler/functionExpressionReturningItself.ts.
outcome: success
source: tests/cases/compiler/functionExpressionReturningItself.ts
---*/
// @target: es2015
// @declaration: true
var x = function somefn() { return somefn; };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
