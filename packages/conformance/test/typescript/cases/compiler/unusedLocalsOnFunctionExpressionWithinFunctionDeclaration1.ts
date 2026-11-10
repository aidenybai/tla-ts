/*---
description: Ported from TypeScript's tests/cases/compiler/unusedLocalsOnFunctionExpressionWithinFunctionDeclaration1.ts.
outcome: success
source: tests/cases/compiler/unusedLocalsOnFunctionExpressionWithinFunctionDeclaration1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function greeter(person: string, person2: string) {
    var unused = 20;
    var maker = function (child: string): void {
        var unused2 = 22;
    }
    person2 = "dummy value";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
