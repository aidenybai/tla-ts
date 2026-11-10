/*---
description: Ported from TypeScript's tests/cases/compiler/typeArgumentsInFunctionExpressions.ts.
outcome: success
source: tests/cases/compiler/typeArgumentsInFunctionExpressions.ts
---*/
// @target: es2015
var obj = function f<T>(a: T) { // should not error
    var x: T;
    return a;
};
 
var obj2 = function f<T>(a: T): T { // should not error
    var x: T;
    return a;
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
