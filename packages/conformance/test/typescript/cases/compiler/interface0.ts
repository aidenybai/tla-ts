/*---
description: Ported from TypeScript's tests/cases/compiler/interface0.ts.
outcome: success
source: tests/cases/compiler/interface0.ts
---*/
// @target: es2015
interface Generic<T> {
    x: T;
}

var y: Generic<number> = { x: 3 };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
