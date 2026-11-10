/*---
description: Ported from TypeScript's tests/cases/compiler/destructuringAssignmentWithStrictNullChecks.ts.
outcome: success
source: tests/cases/compiler/destructuringAssignmentWithStrictNullChecks.ts
---*/
// @target: es2015
// @strictNullChecks: true
let bar: {};
({ ...bar } = {});

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
