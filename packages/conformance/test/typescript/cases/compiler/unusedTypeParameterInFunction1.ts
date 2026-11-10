/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInFunction1.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInFunction1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1<T>() {

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
