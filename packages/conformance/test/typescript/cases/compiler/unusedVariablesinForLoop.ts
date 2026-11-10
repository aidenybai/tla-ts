/*---
description: Ported from TypeScript's tests/cases/compiler/unusedVariablesinForLoop.ts.
outcome: success
source: tests/cases/compiler/unusedVariablesinForLoop.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1 () {
    for(var i = 0; ;) {

    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
