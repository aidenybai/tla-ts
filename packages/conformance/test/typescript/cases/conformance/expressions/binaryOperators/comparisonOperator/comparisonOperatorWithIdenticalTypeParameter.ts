/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/binaryOperators/comparisonOperator/comparisonOperatorWithIdenticalTypeParameter.ts.
outcome: success
source: tests/cases/conformance/expressions/binaryOperators/comparisonOperator/comparisonOperatorWithIdenticalTypeParameter.ts
---*/
// @target: es2015
function foo<T>(t: T) {
    var r1 = t < t;
    var r2 = t > t;
    var r3 = t <= t;
    var r4 = t >= t;
    var r5 = t == t;
    var r6 = t != t;
    var r7 = t === t;
    var r8 = t !== t;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
