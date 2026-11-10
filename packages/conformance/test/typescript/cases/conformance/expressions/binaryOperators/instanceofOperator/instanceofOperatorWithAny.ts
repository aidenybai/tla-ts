/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/binaryOperators/instanceofOperator/instanceofOperatorWithAny.ts.
outcome: throws
source: tests/cases/conformance/expressions/binaryOperators/instanceofOperator/instanceofOperatorWithAny.ts
---*/
// @target: es2015
var a: any;

var r: boolean = a instanceof a;

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
