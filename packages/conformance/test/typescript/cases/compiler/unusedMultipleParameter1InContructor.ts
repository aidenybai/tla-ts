/*---
description: Ported from TypeScript's tests/cases/compiler/unusedMultipleParameter1InContructor.ts.
outcome: success
source: tests/cases/compiler/unusedMultipleParameter1InContructor.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class Dummy {
    constructor(person: string, person2: string) {
        var unused = 20;
        person2 = "Dummy value";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
