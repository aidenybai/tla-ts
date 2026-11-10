/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/nonIterableRestElement2.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/nonIterableRestElement2.ts
---*/
//@target: ES6
var c = {};
[...c] = ["", 0];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
