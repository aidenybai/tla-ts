/*---
description: Ported from TypeScript's tests/cases/conformance/es6/destructuring/restElementWithAssignmentPattern5.ts.
outcome: success
source: tests/cases/conformance/es6/destructuring/restElementWithAssignmentPattern5.ts
---*/
// @target: es2015
var s: string, s2: string;
[...[s, s2]] = ["", ""];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
