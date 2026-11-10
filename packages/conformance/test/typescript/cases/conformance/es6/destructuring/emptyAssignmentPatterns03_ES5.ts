/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns03_ES5.ts.
outcome: throws
source: tests/cases/conformance/es6/destructuring/emptyAssignmentPatterns03_ES5.ts
---*/
// @target: es5, es2015
// @declaration: true

var a: any;

({} = {} = a);
([] = [] = a);

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
