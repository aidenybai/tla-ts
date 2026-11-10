/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/YieldStarExpression4_es6.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/YieldStarExpression4_es6.ts
---*/
// @strict: false
// @target: es6
function *g() {
    yield * [];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
