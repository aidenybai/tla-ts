/*---
description: Ported from TypeScript's tests/cases/conformance/es7/exponentiationOperator/emitCompoundExponentiationAssignmentWithPropertyAccessingOnLHS1.ts.
outcome: success
source: tests/cases/conformance/es7/exponentiationOperator/emitCompoundExponentiationAssignmentWithPropertyAccessingOnLHS1.ts
---*/
﻿// @target: es5, es2015

var globalCounter = 0;
function foo() {
    globalCounter += 1;
    return { prop: 2 };
}
foo().prop **= 2;
var result0 = foo().prop **= 2;
foo().prop **= foo().prop **= 2;
var result1 = foo().prop **= foo().prop **= 2;
foo().prop **= foo().prop ** 2;
var result2 = foo().prop **= foo().prop ** 2;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
