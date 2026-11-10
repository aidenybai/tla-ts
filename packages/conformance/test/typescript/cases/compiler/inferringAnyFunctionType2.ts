/*---
description: Ported from TypeScript's tests/cases/compiler/inferringAnyFunctionType2.ts.
outcome: success
source: tests/cases/compiler/inferringAnyFunctionType2.ts
---*/
// @target: es2015
function f<T extends [(p1: number) => number]>(p: T): T {
    return p;
}

var v = f([x => x]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
