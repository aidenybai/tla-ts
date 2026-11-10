/*---
description: Ported from TypeScript's tests/cases/compiler/spreadParameterTupleType.ts.
outcome: success
source: tests/cases/compiler/spreadParameterTupleType.ts
---*/
// @target: es2015
// @declaration: true

function f1() {
    type A = [s: string];
    type C = [...A, ...A];

    return function fn(...args: C) { } satisfies any
}

function f2() {
    type A = [a: string];
    type B = [b: string];
    type C = [c: string];
    type D = [...A, ...A, ...B, ...A, ...B, ...B, ...A, ...C];

    return function fn(...args: D) { } satisfies any;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
