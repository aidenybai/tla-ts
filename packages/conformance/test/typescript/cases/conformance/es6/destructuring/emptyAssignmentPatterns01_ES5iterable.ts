/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns01_ES5iterable.ts.
outcome: throws
source: tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns01_ES5iterable.ts
---*/
// @target: es5, es2015
// @declaration: true
// @downlevelIteration: true

var a: any;

({} = a);
([] = a);

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
