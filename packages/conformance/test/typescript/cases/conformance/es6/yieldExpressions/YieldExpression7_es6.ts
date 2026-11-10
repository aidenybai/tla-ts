/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/YieldExpression7_es6.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/YieldExpression7_es6.ts
---*/
// @target: es6
function* foo() {
  yield foo
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
