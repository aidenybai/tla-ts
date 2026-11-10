/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedFunctionExpressionES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedFunctionExpressionES6.ts
---*/
// @target: ES6
var x = `abc${ function y() { return y; } }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
