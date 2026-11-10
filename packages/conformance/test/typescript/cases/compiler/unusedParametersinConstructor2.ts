/*---
description: Ported from TypeScript's tests/cases/compiler/unusedParametersinConstructor2.ts.
outcome: success
source: tests/cases/compiler/unusedParametersinConstructor2.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter {
    constructor(param1: string, param2: string) {
        param2 = param2 + "dummy value";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
