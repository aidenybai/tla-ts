/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveUnionTypeInference.ts.
outcome: success
source: tests/cases/compiler/recursiveUnionTypeInference.ts
---*/
// @target: es2015
interface Foo<T> {
    x: T;
}

function bar<T>(x: Foo<T> | string): T {
    return bar(x);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
