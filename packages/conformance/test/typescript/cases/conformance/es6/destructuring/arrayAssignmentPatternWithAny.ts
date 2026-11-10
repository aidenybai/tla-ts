/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/arrayAssignmentPatternWithAny.ts.
outcome: throws
source: tests/cases/conformance/es6/destructuring/arrayAssignmentPatternWithAny.ts
---*/
// @target: es2015
var a: any;
var x: string;
[x] = a;

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
