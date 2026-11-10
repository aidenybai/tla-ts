/*---
description: Ported from TypeScript's tests/cases/compiler/unusedMultipleParameters1InFunctionDeclaration.ts.
outcome: success
source: tests/cases/compiler/unusedMultipleParameters1InFunctionDeclaration.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function greeter(person: string, person2: string) {
    var unused = 20;
    person2 = "dummy value";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
