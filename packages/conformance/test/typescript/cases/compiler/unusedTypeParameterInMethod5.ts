/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInMethod5.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInMethod5.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class A {
    public f1 = function<X>() {

    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
