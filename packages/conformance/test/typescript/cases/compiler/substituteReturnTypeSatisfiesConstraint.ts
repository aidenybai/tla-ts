/*---
description: Ported from TypeScript's tests/cases/compiler/substituteReturnTypeSatisfiesConstraint.ts.
outcome: success
source: tests/cases/compiler/substituteReturnTypeSatisfiesConstraint.ts
---*/
// @target: es2015
type M = { p: string };
type O = { m: () => M };
type X<T extends M> = T;
type FFG<T> = T extends O ? X<ReturnType<T['m']>> : never; // error!

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
