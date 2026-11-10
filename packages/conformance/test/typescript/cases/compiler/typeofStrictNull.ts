/*---
description: Ported from TypeScript's tests/cases/compiler/typeofStrictNull.ts.
outcome: success
source: tests/cases/compiler/typeofStrictNull.ts
---*/
// @target: es2015
// @strictNullChecks: true

let a: number;
let b: typeof a;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
