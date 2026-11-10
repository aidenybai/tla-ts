/*---
description: Ported from TypeScript's tests/cases/compiler/concatTuples.ts.
outcome: success
source: tests/cases/compiler/concatTuples.ts
---*/
// @target: es2015
let ijs: [number, number][] = [[1, 2]];
ijs = ijs.concat([[3, 4], [5, 6]]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
