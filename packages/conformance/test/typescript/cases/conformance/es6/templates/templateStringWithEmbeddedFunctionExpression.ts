/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringWithEmbeddedFunctionExpression.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringWithEmbeddedFunctionExpression.ts
---*/
// @target: es2015
var x = `abc${ function y() { return y; } }def`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
