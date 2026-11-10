/*---
description: Ported from TypeScript's tests/cases/compiler/prefixIncrementAsOperandOfPlusExpression.ts.
outcome: success
source: tests/cases/compiler/prefixIncrementAsOperandOfPlusExpression.ts
---*/
// @target: es2015
var x = 1;
var y = 1;
+ ++x;
+ ++y;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
