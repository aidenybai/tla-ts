/*---
description: Ported from TypeScript's tests/cases/compiler/unusedVariablesinForLoop4.ts.
outcome: success
source: tests/cases/compiler/unusedVariablesinForLoop4.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1 () {
    for (const elem of ["a", "b", "c"]) {
        elem;
        var x = 20;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
