/*---
description: Ported from TypeScript's tests/cases/compiler/inferringAnyFunctionType5.ts.
outcome: success
source: tests/cases/compiler/inferringAnyFunctionType5.ts
---*/
// @target: es2015
function f<T extends { q: (p1: number) => number }>(p: T): T {
    return p;
}

var v = f({ q: x => x });

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
