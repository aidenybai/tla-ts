/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInFunction2.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInFunction2.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1<X, Y>() {
    var a!: X;
    a;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
