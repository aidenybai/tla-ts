/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/restElementWithAssignmentPattern1.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/restElementWithAssignmentPattern1.ts
---*/
//@target: ES6
var a: string, b: number;
[...[a, b = 0]] = ["", 1];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
