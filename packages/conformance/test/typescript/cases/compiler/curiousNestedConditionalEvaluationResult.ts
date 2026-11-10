/*---
description: Ported from TypeScript's tests/cases/compiler/curiousNestedConditionalEvaluationResult.ts.
outcome: success
source: tests/cases/compiler/curiousNestedConditionalEvaluationResult.ts
---*/
// @target: es2015
// regression test for #43123
type Hmm = [0] extends [infer T, any?] ?
    [T, [0] extends [T] ? true : false]
    : never

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
