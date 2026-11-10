/*---
description: Ported from TypeScript's tests/cases/conformance/generators/restParameterInDownlevelGenerator.ts.
outcome: success
source: tests/cases/conformance/generators/restParameterInDownlevelGenerator.ts
---*/
// @target: es5, es2015
// @lib: es2015
// @downlevelIteration: true
// @noEmitHelpers: true

// https://github.com/Microsoft/TypeScript/issues/30653
function * mergeStringLists(...strings: string[]) {
    for (var str of strings);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
