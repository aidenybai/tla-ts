/*---
description: Ported from TypeScript's tests/cases/compiler/circularConstrainedMappedTypeNoCrash.ts.
outcome: success
source: tests/cases/compiler/circularConstrainedMappedTypeNoCrash.ts
---*/
// @target: es2015
type Loop<T, U extends Loop<T, U>> = {
    [P in keyof T]: U[P] extends boolean ? number : string;
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
