/*---
description: Ported from TypeScript's tests/cases/conformance/salsa/typeFromPropertyAssignment38.ts.
outcome: success
source: tests/cases/conformance/salsa/typeFromPropertyAssignment38.ts
---*/
// @target: es2015
// @noEmit: true
// @strict: true
// @declaration: true

function F() {}
F["prop"] = 3;

const f = function () {};
f["prop"] = 3;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
