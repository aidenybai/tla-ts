/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/emptyObjectBindingPatternParameter04.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/emptyObjectBindingPatternParameter04.ts
---*/
// @target: es2015
// @declaration: true

function f({} = {a: 1, b: "2", c: true}) {
    var x, y, z;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
