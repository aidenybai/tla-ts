/*---
description: Ported from TypeScript's tests/cases/compiler/typeofUsedBeforeBlockScoped.ts.
outcome: success
source: tests/cases/compiler/typeofUsedBeforeBlockScoped.ts
---*/
// @target: es2015
type T = typeof C & typeof C.s & typeof o & typeof o.n;
class C {
    static s = 2;
}
type W = typeof o.n;
let o2: typeof o;
let o = { n: 12 };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
