/*---
description: Ported from TypeScript's tests/cases/compiler/noUnusedLocals_potentialPredicateUnusedParam.ts.
outcome: success
source: tests/cases/compiler/noUnusedLocals_potentialPredicateUnusedParam.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true
// @noUnusedLocals: true
// @noUnusedParameters: true

function potentialPredicateUnusedParam(a: unknown) {
  return !!Math.random();
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
