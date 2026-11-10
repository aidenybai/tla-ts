/*---
description: Ported from TypeScript's tests/cases/compiler/forAwaitForUnion.ts.
outcome: success
source: tests/cases/compiler/forAwaitForUnion.ts
---*/
// @target: es2018
// @lib: esnext
async function f<T>(source: Iterable<T> | AsyncIterable<T>) {
    for await (const x of source) {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
