/*---
description: Ported from TypeScript's tests/cases/compiler/typeInferenceTypePredicate2.ts.
outcome: success
source: tests/cases/compiler/typeInferenceTypePredicate2.ts
---*/
// @target: es2015
[true, true, false, null]
    .filter((thing): thing is boolean => thing !== null)
    .map(thing => thing.toString());

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
