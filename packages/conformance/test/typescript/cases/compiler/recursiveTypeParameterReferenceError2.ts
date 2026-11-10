/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveTypeParameterReferenceError2.ts.
outcome: success
source: tests/cases/compiler/recursiveTypeParameterReferenceError2.ts
---*/
// @target: es2015
interface List<T> {
    data: T;
    next: List<T>;
    owner: List<List<T>>;  // Error, recursive reference with wrapped T
}

interface List2<T> {
    data: T;
    next: List2<T>;
    owner: List2<List2<string>>;  // Ok
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
