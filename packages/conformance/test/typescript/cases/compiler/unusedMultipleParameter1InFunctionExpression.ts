/*---
description: Ported from TypeScript's tests/cases/compiler/unusedMultipleParameter1InFunctionExpression.ts.
outcome: success
source: tests/cases/compiler/unusedMultipleParameter1InFunctionExpression.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

var func = function(person: string, person2: string) {
    var unused = 20;
    person2 = "Dummy value";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
