/*---
description: Ported from TypeScript's tests/cases/compiler/constraintPropagationThroughReturnTypes.ts.
outcome: success
source: tests/cases/compiler/constraintPropagationThroughReturnTypes.ts
---*/
// @target: es2015
function g<T>(x: T): T {
  return x;
}
 
function f<S extends { foo: string }>(x: S) {
  var y = g(x);
  y;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
