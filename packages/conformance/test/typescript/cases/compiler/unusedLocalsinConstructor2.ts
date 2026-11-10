/*---
description: Ported from TypeScript's tests/cases/compiler/unusedLocalsinConstructor2.ts.
outcome: success
source: tests/cases/compiler/unusedLocalsinConstructor2.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter {
    constructor() {
        var unused = 20;
        var used = "dummy";
        used = used + "second part";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
