/*---
description: Ported from TypeScript's tests/cases/compiler/unusedMultipleParameters2InMethodDeclaration.ts.
outcome: success
source: tests/cases/compiler/unusedMultipleParameters2InMethodDeclaration.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class Dummy {
    public greeter(person: string, person2: string, person3: string) {
        var unused = 20;
        person2 = "dummy value";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
