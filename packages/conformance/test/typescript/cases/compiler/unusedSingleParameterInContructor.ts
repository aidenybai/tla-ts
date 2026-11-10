/*---
description: Ported from TypeScript's tests/cases/compiler/unusedSingleParameterInContructor.ts.
outcome: success
source: tests/cases/compiler/unusedSingleParameterInContructor.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class Dummy {
    constructor(person: string) {
        var unused = 20;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
