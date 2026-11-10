/*---
description: Ported from TypeScript's tests/cases/compiler/arrayFlatNoCrashInference.ts.
outcome: success
source: tests/cases/compiler/arrayFlatNoCrashInference.ts
---*/
// @target: es2015
// @strict: true
// @lib: es2020
function foo<T>(arr: T[], depth: number) {
    return arr.flat(depth);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
