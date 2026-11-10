/*---
description: Ported from TypeScript's tests/cases/compiler/unusedSingleParameterInFunctionDeclaration.ts.
outcome: success
source: tests/cases/compiler/unusedSingleParameterInFunctionDeclaration.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function greeter(person: string) {
    var unused = 20;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
