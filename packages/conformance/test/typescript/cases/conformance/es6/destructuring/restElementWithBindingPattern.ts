/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/restElementWithBindingPattern.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/restElementWithBindingPattern.ts
---*/
// @target: es2015
var [...[a, b]] = [0, 1];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
