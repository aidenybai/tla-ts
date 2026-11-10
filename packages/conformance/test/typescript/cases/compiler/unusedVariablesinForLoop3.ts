/*---
description: Ported from TypeScript's tests/cases/compiler/unusedVariablesinForLoop3.ts.
outcome: success
source: tests/cases/compiler/unusedVariablesinForLoop3.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1 () {
    for (const elem of ["a", "b", "c"]) {

    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
