/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/restElementWithAssignmentPattern3.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/restElementWithAssignmentPattern3.ts
---*/
// @target: es2015
var a: string, b: number;
var tuple: [string, number] = ["", 1];
[...[a, b = 0]] = tuple;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
