/*---
description: Ported from TypeScript's tests/cases/compiler/unusedSingleParameterInMethodDeclaration.ts.
outcome: success
source: tests/cases/compiler/unusedSingleParameterInMethodDeclaration.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class Dummy {
    public greeter(person: string) {
        var unused = 20;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
