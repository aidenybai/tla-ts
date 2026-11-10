/*---
description: Ported from TypeScript's tests/cases/conformance/types/primitives/void/validVoidAssignments.ts.
outcome: success
source: tests/cases/conformance/types/primitives/void/validVoidAssignments.ts
---*/
// @target: es2015
var x: void;
var y: any;
var z: void;
y = x;
x = y;
x = z;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
