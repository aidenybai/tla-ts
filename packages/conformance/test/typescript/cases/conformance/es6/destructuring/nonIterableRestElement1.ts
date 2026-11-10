/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/nonIterableRestElement1.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/nonIterableRestElement1.ts
---*/
// @target: es2015
var c = {};
[...c] = ["", 0];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
