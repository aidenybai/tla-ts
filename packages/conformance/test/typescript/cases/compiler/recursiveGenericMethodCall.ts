/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveGenericMethodCall.ts.
outcome: success
source: tests/cases/compiler/recursiveGenericMethodCall.ts
---*/
// @target: es2015
interface Generator<T> { (): T; }

function Generate<T>(func: Generator<T>): T {
    return Generate(func);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
