/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInFunctionExpression.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInFunctionExpression.ts
---*/
// @target: es2015
var x = function y() {
    `abc${ 0 }def`
    return `abc${ 0 }def`;
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
