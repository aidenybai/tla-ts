/*---
description: Ported from TypeScript's tests/cases/conformance/types/primitives/boolean/validBooleanAssignments.ts.
outcome: success
source: tests/cases/conformance/types/primitives/boolean/validBooleanAssignments.ts
---*/
// @target: es2015
var x = true;

var a: any = x;
var b: Object = x;
var c: Boolean = x;
var d: boolean = x;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
