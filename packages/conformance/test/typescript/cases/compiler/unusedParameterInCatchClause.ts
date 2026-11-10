/*---
description: Ported from TypeScript's tests/cases/compiler/unusedParameterInCatchClause.ts.
outcome: success
source: tests/cases/compiler/unusedParameterInCatchClause.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1() {
    try {} catch(ex){}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
