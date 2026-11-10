/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameterInInterface1.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameterInInterface1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

interface int<T> {

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
