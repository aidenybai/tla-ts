/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInInterface2.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInInterface2.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

interface int<T, U, V> {
    f1(a: T): string;
    c: V;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
