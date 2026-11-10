/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveConditionalCrash1.ts.
outcome: success
source: tests/cases/compiler/recursiveConditionalCrash1.ts
---*/
// @target: es2015
type C1<T> = [T extends string ? C1<T> : never][0];
type C2<T> = [T extends string ? [C2<T>] : never][0];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
