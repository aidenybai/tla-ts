/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns04_ES6.ts.
outcome: throws
source: tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns04_ES6.ts
---*/
// @target: es6
// @declaration: true

var a: any;
let x, y, z, a1, a2, a3;

({ x, y, z } = {} = a);
([ a1, a2, a3] = [] = a);

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
