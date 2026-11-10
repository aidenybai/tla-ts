/*---
description: Ported from TypeScript's tests/cases/compiler/genericNumberIndex.ts.
outcome: success
source: tests/cases/compiler/genericNumberIndex.ts
---*/
// @target: es2015
type X<I extends number> = ['a'][I];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
