/*---
description: Ported from TypeScript's tests/cases/compiler/unusedParametersinConstructor1.ts.
outcome: success
source: tests/cases/compiler/unusedParametersinConstructor1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter {
    constructor(param1: string) {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
