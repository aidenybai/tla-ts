/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns01_ES6.ts.
outcome: throws
source: tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns01_ES6.ts
---*/
// @target: es6
// @declaration: true

var a: any;

({} = a);
([] = a);

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
