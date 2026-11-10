/*---
description: Ported from TypeScript's tests/cases/compiler/varInFunctionInVarInitializer.ts.
outcome: success
source: tests/cases/compiler/varInFunctionInVarInitializer.ts
---*/
// @target: es2015
var a = function () {
    var c = 1;
    return c;
},
    b = 1;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
