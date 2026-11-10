/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInLambda1.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInLambda1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class A {
    public f1() {
        return <T>() => {

        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
