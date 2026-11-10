/*---
description: Ported from TypeScript's tests/cases/compiler/genericInference1.ts.
outcome: success
source: tests/cases/compiler/genericInference1.ts
---*/
// @target: es2015
['a', 'b', 'c'].map(x => x.length);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
