/*---
description: Ported from TypeScript's tests/cases/compiler/contextuallyTypeGeneratorReturnTypeFromUnion.ts.
outcome: success
source: tests/cases/compiler/contextuallyTypeGeneratorReturnTypeFromUnion.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true
// @lib: esnext

// repro #51187

type Action = () => (Generator<string, string, string[]> | string)

const test1: Action = function* () {
    const next = yield ''
    return next[0]
}

type Action2 = () => (AsyncGenerator<string, string, string[]> | string)

const test2: Action2 = async function* () {
    const next = yield await Promise.resolve('')
    return next[0]
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
