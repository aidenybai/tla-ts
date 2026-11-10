/*---
description: Ported from TypeScript's tests/cases/compiler/instanceofNarrowReadonlyArray.ts.
outcome: success
source: tests/cases/compiler/instanceofNarrowReadonlyArray.ts
---*/
// @target: es2015
// @strict

function narrow(x: readonly number[] | number): readonly number[] {
    if (x instanceof Array) {
        return x;
    } else {
        return [x];
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
