/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTypeLogicalOr.ts.
outcome: success
source: tests/cases/compiler/contextualTypeLogicalOr.ts
---*/
// @target: es2015
// Repro from #18005

let x = 123;
var a =
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4] ||
    x && [1, 2, 3, 4];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
