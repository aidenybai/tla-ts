/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInLambda2.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInLambda2.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class A {
    public f1() {
        return <T, X>() => {
            var a!: X;
            a;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
