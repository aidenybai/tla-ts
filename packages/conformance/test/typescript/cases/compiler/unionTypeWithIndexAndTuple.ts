/*---
description: Ported from TypeScript's tests/cases/compiler/unionTypeWithIndexAndTuple.ts.
outcome: success
source: tests/cases/compiler/unionTypeWithIndexAndTuple.ts
---*/
// @target: es2015
interface I {
    [index: number]: any;
    someOtherProperty: number;
}
function f(args: ["a"] | I) { }
f(["a"]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
