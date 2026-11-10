/*---
description: Ported from TypeScript's tests/cases/compiler/namedFunctionExpressionCall.ts.
outcome: success
source: tests/cases/compiler/namedFunctionExpressionCall.ts
---*/
// @target: es2015
var recurser = function foo() {
    // using the local name
    foo();

    // using the globally visible name
    recurser();
};


(function bar() {
    bar();
});

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
