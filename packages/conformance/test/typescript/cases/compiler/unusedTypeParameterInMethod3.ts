/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInMethod3.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInMethod3.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class A {
    public f1<X, Y, Z>() {
        var a!: X;
        var b!: Y;
        a;
        b;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
