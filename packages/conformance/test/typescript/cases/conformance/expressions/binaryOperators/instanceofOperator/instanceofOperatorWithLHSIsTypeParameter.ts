/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/binaryOperators/instanceofOperator/instanceofOperatorWithLHSIsTypeParameter.ts.
outcome: success
source: tests/cases/conformance/expressions/binaryOperators/instanceofOperator/instanceofOperatorWithLHSIsTypeParameter.ts
---*/
// @target: es2015
function foo<T>(t: T) {
    var x: any;
    var r = t instanceof x;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
