/*---
description: Ported from TypeScript's tests/cases/conformance/types/nonPrimitive/assignObjectToNonPrimitive.ts.
outcome: success
source: tests/cases/conformance/types/nonPrimitive/assignObjectToNonPrimitive.ts
---*/
// @target: es2015
var x = {};
var y = {foo: "bar"};
var a: object;
a = x;
a = y;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
