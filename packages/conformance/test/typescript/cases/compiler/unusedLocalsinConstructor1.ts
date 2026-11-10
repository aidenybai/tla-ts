/*---
description: Ported from TypeScript's tests/cases/compiler/unusedLocalsinConstructor1.ts.
outcome: success
source: tests/cases/compiler/unusedLocalsinConstructor1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter {
    constructor() {
        var unused = 20;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
