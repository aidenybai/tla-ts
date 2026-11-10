/*---
description: Ported from TypeScript's tests/cases/compiler/innerTypeArgumentInference.ts.
outcome: success
source: tests/cases/compiler/innerTypeArgumentInference.ts
---*/
// @target: es2015
interface Generator<T> { (): T; }
function Generate<U>(func: Generator<U>): U {
    return Generate(func);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
