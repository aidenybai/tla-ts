/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns01_ES5.ts.
outcome: throws
source: tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns01_ES5.ts
---*/
// @target: es5, es2015
// @declaration: true

var a: any;

({} = a);
([] = a);

var [,] = [1,2];

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
