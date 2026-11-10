/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInFunction3.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInFunction3.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1<X, Y, Z>() {
    var a!: X;
    var b!: Z;
    a;
    b;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
