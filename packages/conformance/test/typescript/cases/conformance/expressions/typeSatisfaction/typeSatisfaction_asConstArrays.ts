/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/typeSatisfaction/typeSatisfaction_asConstArrays.ts.
outcome: success
source: tests/cases/conformance/expressions/typeSatisfaction/typeSatisfaction_asConstArrays.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

// with readonly array
const arr1 = [1, 2, 3] as const satisfies readonly unknown[]

// with mutable array
const arr2 = [1, 2, 3] as const satisfies unknown[]

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
