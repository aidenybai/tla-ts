/*---
description: Ported from TypeScript's tests/cases/compiler/mappedTypeParameterConstraint.ts.
outcome: success
source: tests/cases/compiler/mappedTypeParameterConstraint.ts
---*/
// @target: es2015
// Repro for #27596

type MyMap<T> = {[P in keyof T]: T[keyof T]};
function foo<U>(arg: U): MyMap<U> {
    return arg;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
