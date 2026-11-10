/*---
description: Ported from TypeScript's tests/cases/compiler/noImplicitAnyFunctionExpressionAssignment.ts.
outcome: success
source: tests/cases/compiler/noImplicitAnyFunctionExpressionAssignment.ts
---*/
// @target: es2015
// @noimplicitany: true

var x: (a: any) => void = function <T>(x: T) {
    return null;
};

var x2: (a: any) => void = function f<T>(x: T) {
    return null;
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
