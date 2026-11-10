/*---
description: Ported from TypeScript's tests/cases/compiler/unusedLocalsOnFunctionDeclarationWithinFunctionExpression1.ts.
outcome: success
source: tests/cases/compiler/unusedLocalsOnFunctionDeclarationWithinFunctionExpression1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

var greeter = function (person: string, person2: string) {
    var unused = 20;
    function maker(child: string): void {
        var unused2 = 22;
    }
    person2 = "dummy value";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
