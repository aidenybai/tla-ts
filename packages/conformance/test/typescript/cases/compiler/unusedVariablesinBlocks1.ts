/*---
description: Ported from TypeScript's tests/cases/compiler/unusedVariablesinBlocks1.ts.
outcome: success
source: tests/cases/compiler/unusedVariablesinBlocks1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1 () {
    let x = 10;
    {
        let x = 11;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
