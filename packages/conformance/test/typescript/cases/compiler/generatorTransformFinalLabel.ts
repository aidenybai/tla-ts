/*---
description: Ported from TypeScript's tests/cases/compiler/generatorTransformFinalLabel.ts.
outcome: success
source: tests/cases/compiler/generatorTransformFinalLabel.ts
---*/
// @target: es5, es2015
// @lib: es5,es6
// @noEmitHelpers: true
async function test(skip: boolean) {
    if (!skip) {
        await 1
    }
    else {
        throw Error('test')
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
