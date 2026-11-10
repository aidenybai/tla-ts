/*---
description: Ported from TypeScript's tests/cases/compiler/functionWithAnyReturnTypeAndNoReturnExpression.ts.
outcome: success
source: tests/cases/compiler/functionWithAnyReturnTypeAndNoReturnExpression.ts
---*/
// @target: es2015
// All should be allowed
function f(): any { }
var f2: () => any = () => { };
var f3 = (): any => { };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
