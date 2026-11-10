/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/emptyArrayBindingPatternParameter01.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/emptyArrayBindingPatternParameter01.ts
---*/
// @target: es2015
// @declaration: true

function f([]) {
    var x, y, z;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
