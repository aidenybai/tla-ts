/*---
description: Ported from TypeScript's tests/cases/compiler/unusedSingleParameterInFunctionExpression.ts.
outcome: success
source: tests/cases/compiler/unusedSingleParameterInFunctionExpression.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

var func = function(person: string) {
    var unused = 20;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
