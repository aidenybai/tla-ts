/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationVarInDownLevelGenerator.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationVarInDownLevelGenerator.ts
---*/
// @target: es5,es2015
// @sourcemap: true
// @downlevelIteration: true
// @noEmitHelpers: true
// @lib: es2015
function * f() {
    var x = 1, y;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
