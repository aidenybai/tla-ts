/*---
description: Ported from TypeScript's tests/cases/compiler/arrayFlatNoCrashInferenceDeclarations.ts.
outcome: success
source: tests/cases/compiler/arrayFlatNoCrashInferenceDeclarations.ts
---*/
// @target: es2015
// @strict: true
// @lib: es2020
// @declaration: true
function foo<T>(arr: T[], depth: number) {
    return arr.flat(depth);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
