/*---
description: Ported from TypeScript's tests/cases/compiler/mapConstructorOnReadonlyTuple.ts.
outcome: success
source: tests/cases/compiler/mapConstructorOnReadonlyTuple.ts
---*/
// @target: es2015

const pairs = [[{}, 1], [{}, 2]] as const;
new Map(pairs);
new WeakMap(pairs);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
