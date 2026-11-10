/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/functionCalls/typeArgumentInferenceTransitiveConstraints.ts.
outcome: success
source: tests/cases/conformance/expressions/functionCalls/typeArgumentInferenceTransitiveConstraints.ts
---*/
// @target: es2015

function fn<A extends Date, B extends A, C extends B>(a: A, b: B, c: C) {
    return [a, b, c];
}

var d = fn(new Date(), new Date(), new Date());
var d: Date[]; // Should be OK (d should be Date[])

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
