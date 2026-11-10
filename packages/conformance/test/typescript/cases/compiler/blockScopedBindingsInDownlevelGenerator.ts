/*---
description: Ported from TypeScript's tests/cases/compiler/blockScopedBindingsInDownlevelGenerator.ts.
outcome: success
source: tests/cases/compiler/blockScopedBindingsInDownlevelGenerator.ts
---*/
// @target: es5, es2015
// @downlevelIteration: true
// @lib: es2015
function* a() {
  for (const i of [1,2,3]) {
    (() => i)()
    yield i
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
