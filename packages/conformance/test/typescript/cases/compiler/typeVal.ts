/*---
description: Ported from TypeScript's tests/cases/compiler/typeVal.ts.
outcome: success
source: tests/cases/compiler/typeVal.ts
---*/
// @target: es2015
interface I {
    I:number;
}

var I:I = { I: 3};
I.I=4;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
