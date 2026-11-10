/*---
description: Ported from TypeScript's tests/cases/compiler/conditionalTypeAnyUnion.ts.
outcome: success
source: tests/cases/compiler/conditionalTypeAnyUnion.ts
---*/
// @target: es2015

// repro from #52568

type Spec = any extends object ? any : string;

type WithSpec<T extends number> = T

type R = WithSpec<Spec> // should not error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
