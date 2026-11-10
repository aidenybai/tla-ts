/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/emptyArrayBindingPatternParameter04.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/emptyArrayBindingPatternParameter04.ts
---*/
// @target: es2015
// @declaration: true

function f([] = [1,2,3,4]) {
    var x, y, z;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
