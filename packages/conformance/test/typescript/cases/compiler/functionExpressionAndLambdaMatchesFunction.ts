/*---
description: Ported from TypeScript's tests/cases/compiler/functionExpressionAndLambdaMatchesFunction.ts.
outcome: success
source: tests/cases/compiler/functionExpressionAndLambdaMatchesFunction.ts
---*/
// @target: es2015
// @strict: false
class CDoc {
        constructor() {
        function doSomething(a: Function) {
        }
        doSomething(() => undefined);
        doSomething(function () { });
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
