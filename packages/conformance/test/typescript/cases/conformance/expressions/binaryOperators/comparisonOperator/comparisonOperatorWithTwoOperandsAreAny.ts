/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/binaryOperators/comparisonOperator/comparisonOperatorWithTwoOperandsAreAny.ts.
outcome: success
source: tests/cases/conformance/expressions/binaryOperators/comparisonOperator/comparisonOperatorWithTwoOperandsAreAny.ts
---*/
// @target: es2015
var a: any;

var r1 = a < a;
var r2 = a > a;
var r3 = a <= a;
var r4 = a >= a;
var r5 = a == a;
var r6 = a != a;
var r7 = a === a;
var r8 = a !== a;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
