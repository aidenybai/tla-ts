/*---
description: Ported from TypeScript's tests/cases/compiler/unusedParameterProperty1.ts.
outcome: success
source: tests/cases/compiler/unusedParameterProperty1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class A {
    constructor(private used: string) {
        let foge = used;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
