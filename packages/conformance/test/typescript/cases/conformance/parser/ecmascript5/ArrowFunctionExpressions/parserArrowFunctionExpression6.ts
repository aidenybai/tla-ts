/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/ArrowFunctionExpressions/parserArrowFunctionExpression6.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/ArrowFunctionExpressions/parserArrowFunctionExpression6.ts
---*/
// @target: es2015
function foo(q: string, b: number) {
    return true ? (q ? true : false) : (b = q.length, function() { });
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
