/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInFunction4.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInFunction4.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1<X, Y, Z>() {
    var a!: Y;
    var b!: Z;
    a;
    b;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
